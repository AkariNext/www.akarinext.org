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
});
