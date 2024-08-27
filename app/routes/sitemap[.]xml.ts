import { generateSitemap } from '@nasa-gcn/remix-seo';
import type { LoaderFunctionArgs } from '@remix-run/node';
// @ts-ignore: どうしようもできないので無視
// eslint-disable-next-line import/no-unresolved
import { routes } from 'virtual:remix/server-build';

export async function loader({ request }: LoaderFunctionArgs) {
	return generateSitemap(request, routes, {
		siteUrl: 'https://www.akarinext.org',
		headers: {
			'Cache-Control': `public, max-age=${60 * 5}`,
		},
	});
}
