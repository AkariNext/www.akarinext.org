const YOUTUBE_HOSTS = new Set([
    'youtube.com',
    'www.youtube.com',
    'm.youtube.com',
    'youtu.be',
    'www.youtu.be',
    'youtube-nocookie.com',
    'www.youtube-nocookie.com',
]);

function sanitizeVideoId(id: string | null | undefined): string | null {
    if (!id) return null;
    const trimmed = id.trim();
    return /^[A-Za-z0-9_-]{11}$/.test(trimmed) ? trimmed : null;
}

export function getYouTubeVideoId(rawUrl: string): string | null {
    if (!rawUrl) return null;

    let url: URL;
    try {
        url = new URL(rawUrl);
    } catch {
        return null;
    }

    const hostname = url.hostname.toLowerCase();
    if (!YOUTUBE_HOSTS.has(hostname)) {
        return null;
    }

    if (hostname.endsWith('youtu.be')) {
        const id = url.pathname.split('/').filter(Boolean)[0];
        return sanitizeVideoId(id);
    }

    if (url.pathname === '/watch') {
        return sanitizeVideoId(url.searchParams.get('v'));
    }

    const segments = url.pathname.split('/').filter(Boolean);
    if (segments.length >= 2) {
        const [kind, id] = segments;
        if (kind === 'embed' || kind === 'shorts' || kind === 'live' || kind === 'v') {
            return sanitizeVideoId(id);
        }
    }

    return null;
}

export function getYouTubeEmbedUrl(rawUrl: string): string | null {
    const videoId = getYouTubeVideoId(rawUrl);
    if (!videoId) return null;
    return `https://www.youtube-nocookie.com/embed/${videoId}?rel=0`;
}
