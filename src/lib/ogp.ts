import ogs from 'open-graph-scraper';

const ogpCache = new Map<string, any>();

export interface OgpData {
    ogTitle?: string;
    ogDescription?: string;
    ogImage?: { url: string }[];
    ogSiteName?: string;
    twitterTitle?: string;
    twitterDescription?: string;
    twitterImage?: { url: string }[];
    [key: string]: any;
}

export async function fetchOgp(url: string): Promise<OgpData | null> {
    if (!url || !url.startsWith('http')) return null;

    let data = ogpCache.get(url);
    if (data) return data;

    try {
        // SSLエラー回避のためのワークアラウンド
        const originalReject = process.env.NODE_TLS_REJECT_UNAUTHORIZED;
        try {
            process.env.NODE_TLS_REJECT_UNAUTHORIZED = '0';
            const { result } = await ogs({ url, timeout: 5000 });
            data = result;
        } finally {
            process.env.NODE_TLS_REJECT_UNAUTHORIZED = originalReject;
        }
        
        if (data) {
            ogpCache.set(url, data);
            return data;
        }
    } catch (e) {
        console.error(`Failed to fetch OGP for ${url}:`, e);
    }

    return null;
}
