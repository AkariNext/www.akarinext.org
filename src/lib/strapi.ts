/**
 * Strapi REST API クライアント（Payload クライアントに近いインターフェース）
 * 環境変数: PUBLIC_STRAPI_URL (例: http://localhost:1337)
 */

import type {
  StrapiMedia,
  StrapiSetting,
  StrapiGame,
  StrapiUser,
  StrapiPost,
  StrapiAnnouncement,
  StrapiGameServer,
} from './cms-types';

const STRAPI_URL = (import.meta.env.PUBLIC_STRAPI_URL || 'http://localhost:1337').replace(/\/$/, '');

function buildStrapiQuery(params: {
  sort?: string | string[];
  limit?: number;
  where?: Record<string, unknown>;
  apiId?: string;
}): string {
  const search = new URLSearchParams();
  if (params.sort) {
    const sortArr = Array.isArray(params.sort) ? params.sort : [params.sort];
    sortArr.forEach((s) => {
      const strapiSort = s.startsWith('-') ? `${s.slice(1)}:desc` : `${s}:asc`;
      search.append('sort', strapiSort);
    });
  }
  if (params.limit != null) search.set('pagination[pageSize]', String(params.limit));

  const apiId = params.apiId ?? '';
  if (apiId === 'posts') {
    // author の avatar まで展開、image はデフォルトで返る
    search.set('populate[author][populate]', '*');
    search.set('populate[image]', 'true');
  } else if (apiId === 'announcements') {
    // announcements には author/image フィールドが存在しないため populate なし
  } else if (apiId === 'games') {
    search.set('populate[cover_image]', 'true');
  } else if (apiId === 'game-servers') {
    search.set('populate', '*');
  } else if (apiId === 'users') {
    // コンポーネント内のリレーション・ゲーム画像まで展開
    search.set('populate[avatar]', 'true');
    search.set('populate[social_links]', 'true');
    search.set('populate[playing_games][populate][game][populate][cover_image]', 'true');
    search.set('populate[finished_games][populate][game][populate][cover_image]', 'true');
  } else {
    search.set('populate', '*');
  }
  if (params.where && Object.keys(params.where).length > 0) {
    for (const [key, val] of Object.entries(params.where)) {
      if (val && typeof val === 'object') {
        if ('equals' in val) {
          search.set(`filters[${key}][$eq]`, String((val as { equals: unknown }).equals));
        } else if ('$notNull' in val) {
          search.set(`filters[${key}][$notNull]`, String((val as { $notNull: unknown }).$notNull));
        }
      }
    }
  }
  return search.toString();
}

async function strapiFetch<T>(path: string, query?: string): Promise<T> {
  const url = query ? `${STRAPI_URL}${path}?${query}` : `${STRAPI_URL}${path}`;
  const res = await fetch(url, { cache: 'no-store' });
  if (!res.ok) throw new Error(`Strapi API Error: ${res.status} ${res.statusText}`);
  return res.json() as Promise<T>;
}

/** Strapi のメディアオブジェクトから表示用 URL を取得 */
export function getMediaUrl(
  media: StrapiMedia | { url?: string } | number | null | undefined
): string | undefined {
  if (!media) return undefined;
  if (typeof media === 'number') return undefined;
  const url = media.url;
  if (!url) return undefined;
  return url.startsWith('http') ? url : `${STRAPI_URL}${url}`;
}

const collectionMap: Record<string, string> = {
  posts: 'posts',
  games: 'games',
  authors: 'users',
  users: 'users',
  announcements: 'announcements',
  'game-servers': 'game-servers',
};

/** 公開済みのみに絞るフィルター（draftAndPublish 利用コレクション用） */
const publishedFilter = (): Record<string, unknown> => ({ publishedAt: { $notNull: true } });

export const strapiClient = {
  items: <T>(collection: string) => ({
    readByQuery: async (query: {
      sort?: string | string[];
      limit?: number;
      where?: Record<string, unknown>;
    } = {}): Promise<T[]> => {
      const apiId = collectionMap[collection] || collection;
      const where = { ...(query.where || {}) };
      // posts / announcements は draftAndPublish=true のため公開済みのみに絞る
      // game-servers は draftAndPublish=false のためフィルタ不要
      if (['posts', 'announcements'].includes(apiId)) {
        Object.assign(where, publishedFilter());
      }
      const q = buildStrapiQuery({ ...query, where, apiId });
      // /api/users (users-permissions) はフラット配列を返す。他は { data: [...] } 形式。
      if (apiId === 'users') {
        const data = await strapiFetch<T[]>(`/api/${apiId}`, q);
        return Array.isArray(data) ? data : [];
      }
      const data = await strapiFetch<{ data: T[] }>(`/api/${apiId}`, q);
      return Array.isArray(data.data) ? data.data : [];
    },
  }),
  singleton: <T>(slug: string) => ({
    read: async (): Promise<T> => {
      const path = slug === 'settings' ? '/api/settings' : `/api/${slug}`;
      const data = await strapiFetch<{ data: T }>(path);
      return data.data;
    },
  }),
};

export type {
  StrapiMedia,
  StrapiSetting,
  StrapiGame,
  StrapiUser,
  StrapiPost,
  StrapiAnnouncement,
  StrapiGameServer,
};
