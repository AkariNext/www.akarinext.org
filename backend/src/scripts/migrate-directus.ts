import 'dotenv/config' // Load env vars before other imports
import { getPayload } from 'payload'
import config from '@payload-config'
import path from 'path'
import fs from 'fs'
import { fileURLToPath } from 'url'
import type { Payload } from 'payload'

const DIRECTUS_URL = process.env.migrate_DIRECTUS_URL || 'http://localhost:8055';
const DIRECTUS_TOKEN = process.env.migrate_DIRECTUS_TOKEN || ''; // If needed

// ID Mappings (Old ID -> New ID)
const mapMedia = new Map<string, number>();
const mapGames = new Map<number, number>();
const mapAuthors = new Map<number, number>();
const mapPosts = new Map<number, number>();

async function fetchDirectus(endpoint: string, params: Record<string, any> = {}) {
    const url = new URL(`${DIRECTUS_URL}/items/${endpoint}`);
    Object.entries(params).forEach(([k, v]) => {
        if (typeof v === 'object') url.searchParams.append(k, JSON.stringify(v));
        else url.searchParams.append(k, String(v));
    });

    // Special handling for assets/files
    if (endpoint === 'files') {
        const fileUrl = new URL(`${DIRECTUS_URL}/${endpoint}`);
        Object.entries(params).forEach(([k, v]) => fileUrl.searchParams.append(k, String(v)));
        // console.log(`Fetching ${fileUrl.toString()}`);
        const res = await fetch(fileUrl.toString());
        if (!res.ok) throw new Error(`Failed to fetch Directus files: ${res.statusText}`);
        return await res.json();
    }

    console.log(`Fetching from Directus: ${url.toString()}`);
    const res = await fetch(url.toString());
    if (!res.ok) {
        // console.error(await res.text());
        throw new Error(`Failed to fetch ${endpoint}: ${res.statusText}`);
    }
    const json = await res.json();
    return json.data;
}

async function fetchDirectusAsset(id: string): Promise<{ buffer: Buffer, filename: string, mimeType: string } | null> {
    try {
        // First get metadata to know filename/type
        const metadata = await fetchDirectus(`files/${id}`); // Actually /files/:id is direct access
        // Directus /files/:id returns metadata. 
        // We need to fetch from /items/directus_files/:id or just /files/:id

        // Let's rely on the file listing we get separately?
        // No, let's just fetch the binary
        const assetUrl = `${DIRECTUS_URL}/assets/${id}`;
        const res = await fetch(assetUrl);
        if (!res.ok) return null;

        const arrayBuffer = await res.arrayBuffer();
        const buffer = Buffer.from(arrayBuffer);

        return {
            buffer,
            filename: `${id}.jpg`, // Defaulting to jpg if unknown, but better if we had metadata
            mimeType: res.headers.get('content-type') || 'image/jpeg'
        };
    } catch (e) {
        console.error(`Failed to download asset ${id}`, e);
        return null;
    }
}

async function migrateMedia(payload: Payload) {
    console.log('--- Migrating Media ---');
    // Fetch all files from Directus
    // endpoint: directus_files
    const url = `${DIRECTUS_URL}/files?limit=-1`;
    const res = await fetch(url);
    if (!res.ok) {
        console.error("Failed to fetch files list");
        return;
    }
    const json = await res.json();
    const files = json.data;

    for (const file of files) {
        if (mapMedia.has(file.id)) continue;

        console.log(`Processing file: ${file.filename_download} (${file.id})`);

        try {
            const assetUrl = `${DIRECTUS_URL}/assets/${file.id}`;
            const imgRes = await fetch(assetUrl);
            if (!imgRes.ok) continue;

            const arrayBuffer = await imgRes.arrayBuffer();
            const buffer = Buffer.from(arrayBuffer);

            const media = await payload.create({
                collection: 'media',
                data: {
                    alt: file.title || file.filename_download,
                },
                file: {
                    data: buffer,
                    name: file.filename_download,
                    mimetype: file.type,
                    size: parseInt(file.filesize),
                }
            });

            mapMedia.set(file.id, media.id);
            console.log(` -> Created media ID: ${media.id}`);
        } catch (e) {
            console.error(`Error migrating file ${file.id}:`, e);
        }
    }
}

async function migrateGames(payload: Payload) {
    console.log('--- Migrating Games ---');
    const games = await fetchDirectus('games', { limit: -1 });

    for (const game of games) {
        // Try to find if already exists (by slug)
        const existing = await payload.find({
            collection: 'games',
            where: { slug: { equals: game.slug } }
        });

        const coverId = game.cover_image ? mapMedia.get(game.cover_image) : null;

        const data = {
            name: game.name,
            slug: game.slug,
            description: game.description,
            cover_image: coverId,
        };

        let result;
        if (existing.docs.length > 0) {
            console.log(`Updating game: ${game.name}`);
            result = await payload.update({
                collection: 'games',
                id: existing.docs[0].id,
                data
            });
        } else {
            console.log(`Creating game: ${game.name}`);
            result = await payload.create({
                collection: 'games',
                data
            });
        }
        mapGames.set(game.id, result.id);
    }
}

async function migrateAuthors(payload: Payload) {
    console.log('--- Migrating Authors ---');
    // Need to fetch deep to get Playing Games relations?
    // Directus returns M2M as array of objects if fetched correctly.
    const authors = await fetchDirectus('authors', {
        limit: -1,
        fields: '*.*' // Fetch everything
    });

    for (const author of authors) {
        if (!author.name) {
            console.warn('Author has no name, skipping or inspecting:', JSON.stringify(author));
            // continue; // Uncomment if you want to skip
        }
        const avatarId = author.avatar ? mapMedia.get(author.avatar) : null;

        // Process Playing Games
        const playing_games = [];
        if (author.playing_games && Array.isArray(author.playing_games)) {
            for (const rel of author.playing_games) {
                // rel.games_id might be the ID or object
                const oldGameId = typeof rel.games_id === 'object' ? rel.games_id.id : rel.games_id;
                const newGameId = mapGames.get(oldGameId);

                if (newGameId) {
                    playing_games.push({
                        game: newGameId,
                        skill_level: rel.skill_level,
                        impression: rel.impression,
                        recruitment: rel.recruitment
                    });
                }
            }
        }

        // Process Finished Games
        const finished_games = [];
        if (author.finished_games && Array.isArray(author.finished_games)) {
            for (const rel of author.finished_games) {
                const oldGameId = typeof rel.games_id === 'object' ? rel.games_id.id : rel.games_id;
                const newGameId = mapGames.get(oldGameId);

                if (newGameId) {
                    finished_games.push({
                        game: newGameId,
                        skill_level: rel.skill_level,
                        impression: rel.impression,
                        recruitment: rel.recruitment
                    });
                }
            }
        }

        // Social Links (Directus might store as JSON or different structure)
        // Assuming Directus 'social_links' was JSON or repeater. 
        // If it's a repeater M2M, current fetch might need adjustment.
        // Let's assume it's comaptible or we map it. 
        // Payload expects array of { platform, url }.
        const social_links = author.social_links // Check if compatible

        const data = {
            name: author.name,
            bio: author.bio,
            is_staff: author.is_staff,
            staff_title: author.staff_title,
            avatar: avatarId,
            playing_games: playing_games.length > 0 ? playing_games : undefined,
            finished_games: finished_games.length > 0 ? finished_games : undefined,
            social_links: Array.isArray(author.social_links) ? author.social_links : [],
        };

        const existing = await payload.find({
            collection: 'authors',
            where: { name: { equals: author.name } } // Match by name as fallback
        });

        let result;
        if (existing.docs.length > 0) {
            console.log(`Updating author: ${author.name}`);
            result = await payload.update({
                collection: 'authors',
                id: existing.docs[0].id,
                data
            });
        } else {
            console.log(`Creating author: ${author.name}`);
            result = await payload.create({
                collection: 'authors',
                data
            });
        }
        mapAuthors.set(author.id, result.id);
    }
}

async function migratePosts(payload: Payload) {
    console.log('--- Migrating Posts ---');
    const posts = await fetchDirectus('posts', { limit: -1 });

    for (const post of posts) {
        const imageId = post.image ? mapMedia.get(post.image) : null;
        let authorId = post.author ? mapAuthors.get(post.author as number) : null;
        if (!authorId && post.author) {
            // Maybe directus returns object
            if (typeof post.author === 'object') authorId = mapAuthors.get(post.author.id);
        }

        const tags = Array.isArray(post.tags) ? post.tags.map((t: string) => ({ tag: t })) : [];

        // Try slug match
        const existing = await payload.find({
            collection: 'posts',
            where: { slug: { equals: post.slug } }
        });

        const data = {
            title: post.title,
            slug: post.slug,
            published_date: post.published_date,
            status: post.status === 'published' ? 'published' : 'draft',
            category: post.category,
            image: imageId,
            author: authorId,
            tags: tags,
            content_html: post.content, // Save RAW CONTENT here
        } as any;

        if (existing.docs.length > 0) {
            console.log(`Updating post: ${post.title}`);
            await payload.update({
                collection: 'posts',
                id: existing.docs[0].id,
                data
            });
        } else {
            console.log(`Creating post: ${post.title}`);
            const res = await payload.create({
                collection: 'posts',
                data
            });
        }
    }
}

async function migrateAnnouncements(payload: Payload) {
    console.log('--- Migrating Announcements ---');
    const anns = await fetchDirectus('announcements', { limit: -1 });

    for (const ann of anns) {
        const data = {
            title: ann.title,
            published_date: ann.published_date,
            status: ann.status === 'published' ? 'published' : 'draft',
            content_html: ann.content, // Save RAW CONTENT
        } as any;

        console.log(`Creating announcement: ${ann.title}`);
        await payload.create({
            collection: 'announcements',
            data
        });
    }
}


async function migrateGameServers(payload: Payload) {
    console.log('--- Migrating Game Servers ---');
    try {
        const servers = await fetchDirectus('game_servers', { limit: -1 });

        for (const server of servers) {
            // Validate and map type
            let type: 'minecraft' | 'web' | 'other' = 'other';
            if (['minecraft', 'web', 'other'].includes(server.type)) {
                type = server.type as 'minecraft' | 'web' | 'other';
            }

            const data = {
                name: server.name,
                type: type,
                ip: server.ip,
                port: server.port ? parseInt(server.port) : 25565,
                protocol: server.protocol || 'TCP',
                description: server.description,
                status: (server.status === 'published' ? 'published' : 'draft') as 'published' | 'draft',
            };

            const existing = await payload.find({
                collection: 'game-servers',
                where: { name: { equals: server.name } }
            });

            if (existing.docs.length > 0) {
                console.log(`Updating game server: ${server.name}`);
                await payload.update({
                    collection: 'game-servers',
                    id: existing.docs[0].id,
                    data
                });
            } else {
                console.log(`Creating game server: ${server.name}`);
                await payload.create({
                    collection: 'game-servers',
                    data
                });
            }
        }
    } catch (e) {
        console.warn("Game Servers not found or failed to migrate (endpoint might be different?).", e);
    }
}

async function migrateSettings(payload: Payload) {
    console.log('--- Migrating Global Settings ---');
    // 'global' is a singleton in Directus too? Usually just 'global' endpoint?
    // Directus has /items/collection for singletons too but id might be needed or just get the first one?
    // Usually 'globals' or similar. Assuming user knows endpoint 'global'
    try {
        const globalParams = await fetchDirectus('global');
        if (globalParams) {
            const logoId = globalParams.site_logo ? mapMedia.get(globalParams.site_logo) : null;

            await payload.updateGlobal({
                slug: 'settings',
                data: {
                    site_title: globalParams.site_title,
                    site_logo: logoId,
                    site_description: globalParams.site_description
                }
            });
            console.log('Settings updated.');
        }
    } catch (e) {
        console.warn("Global settings not found or failed to migrate.", e);
    }
}

const migrate = async () => {
    try {
        const payload = await getPayload({ config })

        await migrateMedia(payload);
        await migrateGames(payload);
        await migrateGameServers(payload);
        await migrateAuthors(payload);
        await migratePosts(payload);
        await migrateAnnouncements(payload);
        await migrateSettings(payload);

        console.log('Done!');
        process.exit(0)
    } catch (err) {
        console.error(err);
        process.exit(1)
    }
}

migrate();
