import type {
    Author,
    Post,
    Announcement,
    Game,
    GameServer,
    Media,
    Setting
} from './payload-types';



const PAYLOAD_URL = import.meta.env.PUBLIC_PAYLOAD_URL || 'http://localhost:3000';

// API Response Wrapper
type PayloadResponse<T> = {
    docs: T[];
    totalDocs: number;
    limit: number;
    totalPages: number;
    page: number;
    pagingCounter: number;
    hasPrevPage: boolean;
    hasNextPage: boolean;
    prevPage: number | null;
    nextPage: number | null;
};

// Helper function to fetch data from Payload REST API
async function fetchPayload<T>(
    collection: string,
    query: Record<string, any> = {}
): Promise<PayloadResponse<T>> {
    const queryString = new URLSearchParams();

    // Convert query object to query string (simple implementation)
    Object.entries(query).forEach(([key, value]) => {
        if (typeof value === 'object') {
            queryString.append(key, JSON.stringify(value));
        } else {
            queryString.append(key, String(value));
        }
    });

    const url = `${PAYLOAD_URL}/api/${collection}?${queryString.toString()}`;

    try {
        const res = await fetch(url);
        if (!res.ok) {
            throw new Error(`Payload API Error: ${res.status} ${res.statusText}`);
        }
        return await res.json();
    } catch (e) {
        console.error(`Failed to fetch from Payload: ${url}`, e);
        // Fallback or rethrow
        throw e;
    }
}

// Media URL Helper
export function getMediaUrl(media: Media | number | null | undefined): string | undefined {
    if (!media) return undefined;
    if (typeof media === 'number') return undefined; // ID only, cannot resolve URL without fetch
    if (media.url) return `${PAYLOAD_URL}${media.url}`;
    return undefined;
}

// Exported Client (Simulating Directus-like interface for easy migration)
export const payloadClient = {
    items: <T>(collection: string) => ({
        readByQuery: async (query: any = {}) => {
            const res = await fetchPayload<T>(collection, query);
            return res.docs;
        },
        readOne: async (id: number) => {
            const url = `${PAYLOAD_URL}/api/${collection}/${id}`;
            const res = await fetch(url);
            if (!res.ok) throw new Error('Not found');
            return await res.json() as T;
        }
    }),
    singleton: <T>(slug: string) => ({
        read: async () => {
            const url = `${PAYLOAD_URL}/api/globals/${slug}`;
            const res = await fetch(url);
            if (!res.ok) throw new Error('Not found');
            return await res.json() as T;
        }
    })
};

// Re-export types
export type { Author, Post, Announcement, Game, GameServer, Media, Setting };
