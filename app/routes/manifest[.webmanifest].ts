import type { WebAppManifest } from '@remix-pwa/dev';
import { json } from '@remix-run/node';

export const loader = () => {
	return json(
		{
			short_name: 'AkariNext',
			name: 'AkariNext',
			start_url: '/',
			display: 'standalone',
			background_color: '#d3d7dd',
			theme_color: '#0F172A',
			icons: [
				{
					src: '/pwa-64x64.png',
					sizes: '64x64',
					type: 'imagec/png',
				},
				{
					src: '/pwa-192x192.png',
					sizes: '192x192',
					type: 'image/png',
				},
				{
					src: '/pwa-512x512.png',
					sizes: '512x512',
					type: 'image/png',
				},
				{
					src: '/maskable-icon-512x512.png',
					sizes: '512x512',
					type: 'image/png',
					purpose: 'maskable',
				},
			],
		} as WebAppManifest,
		{
			headers: {
				'Cache-Control': 'public, max-age=600',
				'Content-Type': 'application/manifest+json',
			},
		},
	);
};
