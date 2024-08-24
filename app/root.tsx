import {
  Links,
  Meta,
  Outlet,
  Scripts,
  ScrollRestoration,
  useLoaderData,
} from "@remix-run/react";
import { ManifestLink } from '@remix-pwa/sw';
import { Navbar } from "./components/navbar";

import "~/tailwind.css";
import { type LinksFunction, type MetaFunction, json } from "@remix-run/node";
import { Footer } from "./components/footer";
import { CONFIG } from "./lib/config.server";

export const links: LinksFunction = () => {
  return [
    { rel: "stylesheet", href: "https://fonts.googleapis.com/css2?family=Noto+Sans+JP:wght@100..900&display=swap" }
  ]
}

export const meta: MetaFunction = () => {
  return [
    { title: "AkariNext" },
    { name: "description", content: "開発からゲームまでもっと楽しいネットライフをAkariNextで！" },
    { name: 'theme-color', content: '#0F172A' }
  ];
};

export function loader() {
  return json({ config: CONFIG }, {
    headers: {
      "Cache-Control": "max-age=300"
    }
  })
}

export function Layout({ children }: { children: React.ReactNode }) {

  const { config } = useLoaderData<typeof loader>()

  return (
    <html lang="ja">
      <head>
        <meta charSet="utf-8" />
        <meta name="viewport" content="width=device-width, initial-scale=1" />
        <Meta />
        <ManifestLink />
        <Links />
      </head>
      <body className="bg-slate-100 w-full mx-auto max-w-screen-sm sm:max-w-screen-xl">
        <div className="px-4 sm:px-8">
          <Navbar />
          <main className="mt-20 max-w-screen-sm sm:max-w-screen-lg mx-auto">
            {children}
          </main>
          <Footer links={config.footer.links} />
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
