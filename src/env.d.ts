/// <reference types="astro/client" />

interface ImportMetaEnv {
	/** ブラウザ向けの画像ベース URL（例: /files）。未設定なら PocketBase を直接指す */
	readonly PUBLIC_MEDIA_BASE?: string;
	/** @deprecated POCKETBASE_URL / PUBLIC_MEDIA_BASE に移行済み。互換のため残す */
	readonly PUBLIC_POCKETBASE_URL?: string;
}

interface ImportMeta {
	readonly env: ImportMetaEnv;
}
