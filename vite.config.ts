import mdx from '@mdx-js/rollup';
import { vitePlugin as remix } from '@remix-run/dev';
import remarkFrontmatter from 'remark-frontmatter';
import remarkMdxFrontmatter from 'remark-mdx-frontmatter';
import { defineConfig } from 'vite';
import tsconfigPaths from 'vite-tsconfig-paths';
import arraybuffer from 'vite-plugin-arraybuffer';
import { devErrorBoundary } from '@metronome-sh/dev-error-boundary';
import { flatRoutes } from 'remix-flat-routes';
import { installGlobals } from '@remix-run/node';

installGlobals({ nativeFetch: true });

declare module "@remix-run/node" {
    interface Future {
        v3_singleFetch: true;
    }
}

export default defineConfig({
	build: {
		target: 'ES2023',
	},
	plugins: [
		mdx({
			remarkPlugins: [remarkFrontmatter, remarkMdxFrontmatter],
		}),
		arraybuffer(),
		remix({
			ignoredRouteFiles: ['**/*'],
			serverModuleFormat: 'esm',
			future: { v3_singleFetch: true },
			routes: async (defineRoutes) => {
				return flatRoutes('routes', defineRoutes, {
					ignoredRouteFiles: ['.*', '**/*.css', '**/__*.*'],
				});
			},
		}),
		tsconfigPaths(),
		devErrorBoundary(),
	],
});
