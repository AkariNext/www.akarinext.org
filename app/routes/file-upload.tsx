import { ActionFunctionArgs } from "@remix-run/node";
import { authenticator } from "~/lib/auth.server";



export async function action({request}: ActionFunctionArgs) {
    const user = await authenticator.isAuthenticated(request, {
        failureRedirect: "/login",
    });
}