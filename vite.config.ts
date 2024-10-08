import mdx from '@mdx-js/rollup';
import { vitePlugin as remix } from '@remix-run/dev';
import remarkFrontmatter from 'remark-frontmatter';
import remarkMdxFrontmatter from 'remark-mdx-frontmatter';
import { installGlobals } from '@remix-run/node';
import { defineConfig } from 'vite';
import tsconfigPaths from 'vite-tsconfig-paths';
import arraybuffer from 'vite-plugin-arraybuffer';
import { devErrorBoundary } from '@metronome-sh/dev-error-boundary';
import {flatRoutes} from 'remix-flat-routes';

installGlobals({ nativeFetch: true });

export default defineConfig({
	plugins: [
		mdx({
			remarkPlugins: [remarkFrontmatter, remarkMdxFrontmatter],
		}),
		arraybuffer(),
		remix({
			ignoredRouteFiles: ['**/*'],
			serverModuleFormat: 'esm',
			future: { unstable_singleFetch: true },
			routes: async (defineRoutes) => {
				return flatRoutes('routes', defineRoutes, {
					ignoredRouteFiles: ['.*', '**/*.css', '**/__*.*'],
				});
			},
		}),
		tsconfigPaths(),
		// devErrorBoundary(),
	],
});
