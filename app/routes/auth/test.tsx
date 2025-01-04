import type { LoaderFunctionArgs, ActionFunctionArgs } from "react-router";
import { getUserSession, logout } from "app/modules/auth/auth.server";
import { redirect } from "react-router";

export async function loader({ request }: LoaderFunctionArgs) {
    const user = await getUserSession(request);
    if (!user) {
        return redirect("/");
    }
    return user;
}

export async function action({ request }: ActionFunctionArgs) {
    try {
        return await logout(request);
    } catch (e) {
        console.error(e);
        return new Response("Logout failed", { status: 500 });
    }
}

export default function Success() {
    return (
        <>
            <h1>ログイン成功</h1>
            <form method="post">
                <button type="submit">ログアウト</button>
            </form>
        </>
    );
}