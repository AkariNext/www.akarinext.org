// @ts-check

import node from "@astrojs/node";
import { defineConfig } from "astro/config";

// https://astro.build/config
export default defineConfig({
	site: "https://www.akarinext.org",
	output: "server",
	adapter: node({
		mode: "standalone",
	}),
	security: {
		// Astro の CSRF 検査は Origin ヘッダとリクエスト URL を突き合わせる。
		// このサイトは Cloudflare と Traefik の背後にあり、アプリには HTTP で届くため
		// ブラウザが送る https の Origin と一致せず、正当な送信まで 403 になる。
		// 代わりに lib/dashboard.server.ts の isSameOriginRequest() を使う。
		// あちらは astro.config の site を許可オリジンに含むので、プロキシ越しでも正しい。
		checkOrigin: false,
	},
});
