import {
	Links,
	Meta,
	Outlet,
	Scripts,
	ScrollRestoration,
	useRouteLoaderData,
	useRouteError,
} from '@remix-run/react';
import { Navbar } from './components/navbar';

import '~/tailwind.css';
import '~/style.css';
import { type LinksFunction, type MetaFunction, json } from '@remix-run/node';
import { Footer } from './components/footer';
import { CONFIG } from './lib/config.server';
import { ReactNode } from 'react';

export const links: LinksFunction = () => {
	return [
		{
			rel: 'stylesheet',
			href: 'https://fonts.googleapis.com/css2?family=Noto+Sans+JP:wght@100..900&display=swap',
		},
	];
};

export const meta: MetaFunction = () => {
	return [
		{ title: 'AkariNext' },
		{
			name: 'description',
			content: '開発からゲームまでもっと楽しいネットライフをAkariNextで！',
		},
		{ name: 'theme-color', content: '#0F172A' },
	];
};

export function loader() {
	return json(
		{ config: CONFIG },
		{
			headers: {
				'Cache-Control': 'max-age=300',
			},
		},
	);
}

export function ErrorBoundary() {
	const error = useRouteError();
	console.error(error);
	return (
		<html>
			<head>
				<title>Oh no!</title>
				<Meta />
				<Links />
			</head>
			<body>
				<Scripts />
			</body>
		</html>
	);
}

export function Layout({ children }: { children: ReactNode }) {
	// TODO: これどうにかしたい
	const { config } = useRouteLoaderData<typeof loader>("root");

	return (
		<html lang="ja">
			<head>
				<meta charSet="utf-8" />
				<meta name="viewport" content="width=device-width, initial-scale=1" />
				<Meta />
				<Links />
			</head>
			<body className="bg-slate-100 w-full">
				<div>
					<Navbar />
					<main className="mx-auto">
						{children}
					</main>
					<Footer links={config?.footer.links} />
				</div>
				<ScrollRestoration />
				<Scripts />
			</body>
		</html>
	);
}

export default function App() {
	return <Outlet />;
}
