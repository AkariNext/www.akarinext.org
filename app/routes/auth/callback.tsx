import { redirect, type LoaderFunctionArgs } from "react-router";
import { getUserSession } from "app/modules/auth/auth.server";

export async function loader({ request }: LoaderFunctionArgs) {
    try {
        const user = await getUserSession(request);
        if (user) {
            throw redirect("/auth/test");
        }
    } catch (e) {
        if (e instanceof Response) {
            throw e;
        }
        console.error(e);
        redirect("/");
    }
}

export default function Calback() {
    return <></>;
}
