/// <reference types="astro/client" />

interface ImportMetaEnv {
	readonly PUBLIC_DIRECTUS_URL: string;
	readonly PUBLIC_SKIP_DIRECTUS_BUILD: string;
}

interface ImportMeta {
	readonly env: ImportMetaEnv;
}
