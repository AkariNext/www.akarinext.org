import {
	Links,
	Meta,
	Outlet,
	Scripts,
	ScrollRestoration,
	useRouteError,
} from '@remix-run/react';

import '~/tailwind.css';
import '~/style.css';
import {
	LoaderFunctionArgs,
	type LinksFunction,
	type MetaFunction,
} from '@remix-run/node';
import { ReactNode } from 'react';
import { authenticator } from './lib/auth.server';

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

// export function loader() {
// 	return json(
// 		{ config: CONFIG },
// 		{
// 			headers: {
// 				'Cache-Control': 'max-age=300',
// 			},
// 		},
// 	);
// }

export async function loader({ request }: LoaderFunctionArgs) {
	const user = await authenticator.isAuthenticated(request);
	return { user };
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
					<main className="mx-auto">{children}</main>
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
