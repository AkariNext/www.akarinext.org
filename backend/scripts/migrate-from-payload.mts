/**
 * Payload CMS → Strapi データ移行スクリプト
 *
 * 環境変数:
 *   PAYLOAD_URL     - Payload API のベースURL (例: http://localhost:3000)
 *   STRAPI_URL      - Strapi API のベースURL (例: http://localhost:1337)
 *   STRAPI_API_TOKEN - Strapi の API トークン (Admin > Settings > API Tokens で発行)
 *
 * 実行: pnpm run migrate:payload
 */

import 'dotenv/config';
import { strapi as createStrapiClient } from '@strapi/client';
import { promises as fs } from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const PAYLOAD_URL = process.env.PAYLOAD_URL?.replace(/\/$/, '') || 'http://localhost:3000';
const STRAPI_URL = process.env.STRAPI_URL?.replace(/\/$/, '') || 'http://localhost:1337';
const STRAPI_API_TOKEN = process.env.STRAPI_API_TOKEN;

if (!STRAPI_API_TOKEN) {
  console.error('STRAPI_API_TOKEN を設定してください。');
  process.exit(1);
}

// 現在のスクリプトのディレクトリ（メディアIDマップを永続化するために使用）
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const MEDIA_MAP_FILE = path.join(__dirname, '.migrate-media-map.json');

// Strapi Client（/api を baseURL に含める）
const strapiClient = createStrapiClient({
  baseURL: `${STRAPI_URL}/api`,
  auth: STRAPI_API_TOKEN,
});

async function payloadGet<T>(path: string): Promise<T> {
  const res = await fetch(`${PAYLOAD_URL}${path}`);
  if (!res.ok) throw new Error(`Payload GET ${path}: ${res.status}`);
  return res.json() as Promise<T>;
}

async function payloadGetDocs<T>(collection: string, limit = 500): Promise<T[]> {
  const data = await payloadGet<{ docs: T[] }>(
    `/api/${collection}?limit=${limit}&depth=0`
  );
  return data.docs || [];
}

async function strapiGet<T>(path: string): Promise<T> {
  const resourcePath = path.replace(/^\/api\//, '');
  // Strapi Client の fetch は baseURL からの相対パスを受け取る
  return strapiClient.fetch(resourcePath, { method: 'GET' }) as Promise<T>;
}

async function strapiPost(path: string, body: unknown): Promise<{ data: { id: number } }> {
  const resourcePath = path.replace(/^\/api\//, '');
  try {
    const res = (await strapiClient.fetch(resourcePath, {
      method: 'POST',
      body: { data: body },
    })) as { data: { id: number } };
    return res;
  } catch (e: any) {
    const status = e?.response?.status ?? e?.status;
    if (status === 405) {
      console.error('\n405 Method Not Allowed のときは次を確認してください:');
      console.error('  1) リバースプロキシ(Nginx/Cloudflare等)で /api/* への POST が許可されているか');
      console.error('  2) Strapi 管理画面 > Settings > Roles > トークンのロールで Game の create にチェックが入っているか');
      console.error('  3) 一度 STRAPI_URL=http://localhost:1337 でローカル Strapi に投げて成功するか試す');
    }
    throw e;
  }
}

async function strapiPut(path: string, body: unknown): Promise<{ data: { id: number } }> {
  const resourcePath = path.replace(/^\/api\//, '');
  try {
    const res = (await strapiClient.fetch(resourcePath, {
      method: 'PUT',
      body: { data: body },
    })) as { data: { id: number } };
    return res;
  } catch (e: any) {
    throw e;
  }
}

type PayloadMedia = { id: number; url?: string | null; filename?: string | null; alt: string };
const mediaIdMap = new Map<number, number>();

async function loadMediaMap() {
  try {
    const json = await fs.readFile(MEDIA_MAP_FILE, 'utf-8');
    const parsed = JSON.parse(json) as Record<string, number>;
    for (const [k, v] of Object.entries(parsed)) {
      const keyNum = Number(k);
      if (!Number.isNaN(keyNum)) {
        mediaIdMap.set(keyNum, v);
      }
    }
    console.log(`Loaded media map entries: ${mediaIdMap.size}`);
  } catch {
    // 初回実行など、ファイルが無いときは無視
  }
}

async function saveMediaMap() {
  const obj: Record<string, number> = {};
  for (const [k, v] of mediaIdMap.entries()) {
    obj[String(k)] = v;
  }
  await fs.writeFile(MEDIA_MAP_FILE, JSON.stringify(obj, null, 2), 'utf-8');
}

async function migrateMedia() {
  console.log('Migrating media...');
  const docs = await payloadGetDocs<PayloadMedia>('media');
  for (const m of docs) {
    if (mediaIdMap.has(m.id)) {
      // 既にマッピングがある場合は再アップロードせずスキップ
      continue;
    }
    const fileUrl = m.url ? (m.url.startsWith('http') ? m.url : `${PAYLOAD_URL}${m.url}`) : null;
    let strapiId: number | null = null;
    if (fileUrl) {
      try {
        const fileRes = await fetch(fileUrl);
        if (!fileRes.ok) continue;
        const arrayBuffer = await fileRes.arrayBuffer();
        const buffer = Buffer.from(arrayBuffer);
        const uploaded = (await strapiClient.files.upload(buffer, {
          filename: m.filename || 'file',
          mimetype: fileRes.headers.get('content-type') || 'application/octet-stream',
          fileInfo: {
            alternativeText: m.alt,
          },
        })) as { id: number }[];
        if (uploaded?.length) {
          strapiId = uploaded[0].id;
        }
      } catch (e) {
        console.warn(`Media ${m.id} upload skip:`, e);
      }
    }
    if (strapiId != null) mediaIdMap.set(m.id, strapiId);
  }
  console.log(`Media: ${mediaIdMap.size} / ${docs.length}`);
  await saveMediaMap();
}

type PayloadGame = { id: number; name: string; slug: string; description?: string; cover_image?: number | null };
const gameIdMap = new Map<number, number>();

async function migrateGames() {
  console.log('Migrating games...');
  const docs = await payloadGetDocs<PayloadGame>('games');
  for (const g of docs) {
    const coverId = g.cover_image ? mediaIdMap.get(Number(g.cover_image)) : null;
    const body = {
      name: g.name,
      slug: g.slug,
      description: g.description ?? undefined,
      cover_image: coverId ?? undefined,
    };
    const { data } = await strapiPost('/api/games', body);
    gameIdMap.set(g.id, data.id);
  }
  console.log(`Games: ${gameIdMap.size}`);
}

type PayloadAuthor = {
  id: number;
  name: string;
  avatar?: number | null;
  is_staff?: boolean;
  staff_title?: string;
  bio?: string;
  social_links?: { platform?: string; url?: string }[];
  playing_games?: { game: number; skill_level?: string; impression?: string; recruitment?: string }[];
  finished_games?: { game: number; skill_level?: string; impression?: string; recruitment?: string }[];
};
const authorIdMap = new Map<number, number>();

async function migrateAuthors() {
  console.log('Migrating authors → users...');
  const docs = await payloadGetDocs<PayloadAuthor>('authors');
  for (const a of docs) {
    const avatarId = a.avatar ? mediaIdMap.get(Number(a.avatar)) : null;
    const playing_games = (a.playing_games || []).map((pg) => {
      const gid = gameIdMap.get(Number(pg.game));
      if (gid == null) return null;
      return { game: gid, skill_level: pg.skill_level, impression: pg.impression, recruitment: pg.recruitment };
    }).filter(Boolean);
    const finished_games = (a.finished_games || []).map((fg) => {
      const gid = gameIdMap.get(Number(fg.game));
      if (gid == null) return null;
      return { game: gid, skill_level: fg.skill_level, impression: fg.impression, recruitment: fg.recruitment };
    }).filter(Boolean);
    const username = `user-${a.id}`;
    const email = `author-${a.id}@migrated.local`;
    const body = {
      username,
      email,
      password: `Migrated${a.id}_${Date.now()}`,
      name: a.name,
      avatar: avatarId ?? undefined,
      is_staff: a.is_staff ?? false,
      staff_title: a.staff_title ?? undefined,
      bio: a.bio ?? undefined,
      social_links: (a.social_links || []).map((s) => ({ platform: s.platform, url: s.url })),
      playing_games,
      finished_games,
    };
    try {
      const { data } = await strapiPost('/api/users', body);
      authorIdMap.set(a.id, data.id);
    } catch (e) {
      console.warn(`User ${username} skip:`, e);
    }
  }
  console.log(`Users: ${authorIdMap.size} / ${docs.length}`);
}

type PayloadPost = {
  id: number;
  title: string;
  slug?: string;
  content?: unknown;
  author?: number | null;
  published_date?: string;
  category: string;
  tags?: { tag?: string }[];
  image?: number | null;
  status?: string;
};
async function migratePosts() {
  console.log('Migrating posts...');
  const docs = await payloadGetDocs<PayloadPost>('posts');
  for (const p of docs) {
    const authorId = p.author ? authorIdMap.get(Number(p.author)) : null;
    const imageId = p.image ? mediaIdMap.get(Number(p.image)) : null;
    const tags = Array.isArray(p.tags) ? p.tags.map((t) => ({ tag: t.tag })) : undefined;
    const content = p.content && typeof p.content === 'object'
      ? (p.content as { root?: { children?: unknown[] } }).root?.children
        ? JSON.stringify(p.content)
        : null
      : null;
    const body = {
      title: p.title,
      slug: p.slug || undefined,
      content: content ?? undefined,
      author: authorId ?? undefined,
      published_date: p.published_date ?? undefined,
      category: p.category || 'game',
      tags: tags ?? undefined,
      image: imageId ?? undefined,
      publishedAt: p.status === 'published' ? (p.published_date || new Date().toISOString()) : null,
    };
    await strapiPost('/api/posts', body);
  }
  console.log(`Posts: ${docs.length}`);
}

type PayloadAnnouncement = { title: string; content?: unknown; published_date?: string; status?: string };
async function migrateAnnouncements() {
  console.log('Migrating announcements...');
  const docs = await payloadGetDocs<PayloadAnnouncement>('announcements');
  for (const a of docs) {
    const content = a.content && typeof a.content === 'object' ? JSON.stringify(a.content) : null;
    const body = {
      title: a.title,
      content: content ?? undefined,
      published_date: a.published_date ?? undefined,
      publishedAt: a.status === 'published' ? (a.published_date || new Date().toISOString()) : null,
    };
    await strapiPost('/api/announcements', body);
  }
  console.log(`Announcements: ${docs.length}`);
}

type PayloadGameServer = {
  name: string;
  type: string;
  ip: string;
  port: number;
  protocol?: string;
  description?: string;
  status?: string;
};
async function migrateGameServers() {
  console.log('Migrating game-servers...');
  const docs = await payloadGetDocs<PayloadGameServer>('game-servers');
  for (const s of docs) {
    const body = {
      name: s.name,
      type: s.type,
      ip: s.ip,
      port: s.port,
      protocol: s.protocol ?? 'TCP',
      description: s.description ?? undefined,
      publishedAt: s.status === 'published' ? new Date().toISOString() : null,
    };
    await strapiPost('/api/game-servers', body);
  }
  console.log(`Game-servers: ${docs.length}`);
}

type PayloadSettings = { site_title?: string; site_description?: string; site_logo?: number | null };
async function migrateSettings() {
  console.log('Migrating settings...');
  const g = await payloadGet<PayloadSettings>('/api/globals/settings');
  const logoId = g.site_logo ? mediaIdMap.get(Number(g.site_logo)) : null;
  const body = {
    site_title: g.site_title ?? undefined,
    site_description: g.site_description ?? undefined,
    site_logo: logoId ?? undefined,
  };
  await strapiPut('/api/settings', body);
  console.log('Settings done.');
}

async function main() {
  console.log('Payload URL:', PAYLOAD_URL);
  console.log('Strapi URL:', STRAPI_URL);
  await loadMediaMap();
  await migrateMedia();
  await migrateGames();
  await migrateAuthors();
  await migratePosts();
  await migrateAnnouncements();
  await migrateGameServers();
  await migrateSettings();
  console.log('Migration finished.');
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
