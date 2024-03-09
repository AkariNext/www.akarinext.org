import {
  Links,
  Meta,
  Outlet,
  Scripts,
  ScrollRestoration,
  useLoaderData,
} from "@remix-run/react";
import { Navbar } from "./components/navbar";

import "~/tailwind.css";
import { LinksFunction, json } from "@remix-run/node";
import { Footer } from "./components/footer";
import { CONFIG } from "./lib/config.server";

export const links: LinksFunction = () => {
  return [
    { rel: "stylesheet", href: "https://fonts.googleapis.com/css?family=Sawarabi+Gothic" }
  ]
}

export function loader() {
  return json({ config: CONFIG })
}

export function Layout({ children }: { children: React.ReactNode }) {

  const { config } = useLoaderData<typeof loader>()

  return (
    <html lang="ja">
      <head>
        <meta charSet="utf-8" />
        <meta name="viewport" content="width=device-width, initial-scale=1" />
        <Meta />
        <Links />
      </head>
      <body className="bg-slate-100">
        <div className="container">
          <div className="mt-4">
            <Navbar />
          </div>
          <main className="mt-8">
            {children}
          </main>
          <Footer links={config.footer.links} />
          <ScrollRestoration />
          <Scripts />
        </div>
      </body>
    </html>
  );
}

export default function App() {
  return <Outlet />;
}
