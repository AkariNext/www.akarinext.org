import { existsSync } from "node:fs";
import fs from "node:fs/promises";
import path from "node:path";
import ogs from "open-graph-scraper";

const CACHE_DIR = path.resolve(process.cwd(), ".cache");
const CACHE_FILE = path.join(CACHE_DIR, "ogp.json");

let memoryCache: Map<string, OgpData> | null = null;

async function getCache(): Promise<Map<string, OgpData>> {
	if (memoryCache) return memoryCache;

	memoryCache = new Map();
	try {
		if (!existsSync(CACHE_DIR)) {
			await fs.mkdir(CACHE_DIR, { recursive: true });
		}

		if (existsSync(CACHE_FILE)) {
			const content = await fs.readFile(CACHE_FILE, "utf-8");
			const json = JSON.parse(content) as Record<string, OgpData>;
			for (const [k, v] of Object.entries(json)) {
				memoryCache.set(k, v);
			}
		}
	} catch (e) {
		console.warn("[OGP] Failed to init cache:", e);
	}
	return memoryCache;
}

async function saveCacheToDisk() {
	if (!memoryCache) return;
	try {
		if (!existsSync(CACHE_DIR)) {
			await fs.mkdir(CACHE_DIR, { recursive: true });
		}
		const obj = Object.fromEntries(memoryCache);
		await fs.writeFile(CACHE_FILE, JSON.stringify(obj, null, 2));
	} catch (e) {
		console.warn("[OGP] Failed to save cache:", e);
	}
}

export interface OgpData {
	ogTitle?: string;
	ogDescription?: string;
	ogImage?: { url: string }[];
	ogSiteName?: string;
	twitterTitle?: string;
	twitterDescription?: string;
	twitterImage?: { url: string }[];
	// open-graph-scraper はここに挙げた以外の項目も返す。
	// 中身が分からないので、使う側で確かめさせる
	[key: string]: unknown;
}

export async function fetchOgp(url: string): Promise<OgpData | null> {
	if (!url || !url.startsWith("http")) return null;

	const cache = await getCache();
	const cached = cache.get(url);
	if (cached) return cached;

	try {
		console.log(`[OGP] Fetching: ${url}`);
		// SSLエラー回避のためのワークアラウンド
		const originalReject = process.env.NODE_TLS_REJECT_UNAUTHORIZED;
		try {
			process.env.NODE_TLS_REJECT_UNAUTHORIZED = "0";
			const { result } = await ogs({ url, timeout: 5000 });

			if (result?.success) {
				cache.set(url, result);
				// 非同期で保存（結果を待たずに返す）
				saveCacheToDisk();
				return result;
			}
		} finally {
			process.env.NODE_TLS_REJECT_UNAUTHORIZED = originalReject;
		}
	} catch (e) {
		console.error(`Failed to fetch OGP for ${url}:`, e);
	}

	return null;
}
