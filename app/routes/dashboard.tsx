import {Link, Outlet, useLocation, useNavigation} from '@remix-run/react';
import { Footer } from '~/components/footer';
import { Navbar } from '~/components/navbar';
import { useUser } from '~/lib/user';
import {LoaderFunctionArgs} from "@remix-run/node";
import {authenticator} from "~/lib/auth.server";
import React, {useTransition} from "react";
import {cn} from "~/lib/utils";

export async function loader({request}: LoaderFunctionArgs) {
    await authenticator.isAuthenticated(request, {
        failureRedirect: '/login'
    });

    return {};
}

const LINKS = [{
    title: "記事の管理",
    to: "/dashboard/articles"
}, {
    title: "ファイルの管理",
    to: "/dashboard/files"
}]

export default function DashboardLayout() {
    const user = useUser() ?? undefined;

    const location = useLocation()

    return (
        <div className='bg-white'>
            <Navbar user={user} className={"mb-16"}/>
            <div className="grid grid-cols-12 gap-8 akari-container">
                <aside className="col-span-12 md:col-span-3 bg-white w-full h-full rounded-xl p-3">
                    <ul>
                        {LINKS.map((link) => <li key={link.title} className={cn("rounded-xl py-2 pl-3 mb-2 hover:bg-gray-100 transition-colors duration-100 select-none cursor-pointer", location.pathname === link.to && "bg-blue-400 text-white hover:bg-blue-500")}>
                            {location.pathname === link.to ? <p key={link.to}>{link.title}</p> : <Link to={link.to}>{link.title}</Link>}
                        </li>)}
                    </ul>
                </aside>
                <main className="col-span-12 md:col-span-9">
                    <Outlet />
                </main>
            </div>

            <Footer />
        </div>
    );
}
