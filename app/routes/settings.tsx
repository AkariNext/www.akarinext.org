import { Outlet } from '@remix-run/react';
import { Footer } from '~/components/footer';
import { Navbar } from '~/components/navbar';
import { useUser } from '~/lib/user';
import {LoaderFunctionArgs} from "@remix-run/node";
import {authenticator} from "~/lib/auth.server";

export async function loader({request}: LoaderFunctionArgs) {
    await authenticator.isAuthenticated(request, {
        failureRedirect: '/login'
    });

    return {};
}

export default function SettingsLayout() {
    const user = useUser() ?? undefined;
    return (
        <>
            <Navbar user={user} />
            <Outlet />
            <Footer />
        </>
    );
}
