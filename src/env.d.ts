/// <reference types="astro/client" />

interface ImportMetaEnv {
	readonly PUBLIC_DIRECTUS_URL: string;
	readonly PUBLIC_SKIP_DIRECTUS_BUILD: string;
	readonly PUBLIC_PAYLOAD_URL: string;
}

interface ImportMeta {
	readonly env: ImportMetaEnv;
}
