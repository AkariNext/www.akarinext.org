import mdx from '@mdx-js/rollup';
import { vitePlugin as remix } from '@remix-run/dev';
import remarkFrontmatter from 'remark-frontmatter';
import remarkMdxFrontmatter from 'remark-mdx-frontmatter';
import { installGlobals } from '@remix-run/node';
import { defineConfig } from 'vite';
import tsconfigPaths from 'vite-tsconfig-paths';
import arraybuffer from 'vite-plugin-arraybuffer';
import { remixPWA } from '@remix-pwa/dev';
import { devErrorBoundary } from '@metronome-sh/dev-error-boundary';

installGlobals({nativeFetch: true});

export default defineConfig({
	plugins: [
		mdx({
			remarkPlugins: [remarkFrontmatter, remarkMdxFrontmatter],
		}),
		arraybuffer(),
		remixPWA(),
		remix({ serverModuleFormat: 'esm', future: {unstable_singleFetch: true} }),
		tsconfigPaths(),
		// devErrorBoundary(),
	],
});
