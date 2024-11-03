import {ActionFunctionArgs, json, LoaderFunctionArgs} from "@remix-run/node";
import {z} from "zod";
import {parseWithZod} from "@conform-to/zod";
import {db} from "~/lib/db.server";
import {authenticator} from "~/lib/auth.server";
import { Form, useLoaderData } from "@remix-run/react";
import { Button } from "~/components/ui/button";

const schema = z.object({
    displayName: z.string().optional()
})

export async function loader({request}: LoaderFunctionArgs) {
    const user = await authenticator.isAuthenticated(request, {
        failureRedirect: '/login'
    });

    

    return await db.user.findFirst({
        where: {
            id: user.id
        }
    })
}

export async function action({request}: ActionFunctionArgs) {
    if (request.method !== 'POST') {
        throw new Response(null);
    }
    const user = await authenticator.isAuthenticated(request, {
        failureRedirect: '/login'
    });

    const formData = await request.formData();
    const submission = parseWithZod(formData, {schema});

    
    if (submission.status !== 'success') {
        return json(submission.reply());
    }

    const {displayName} = submission.value

    return await db.user.update({
        where: {
            id: user.id
        },
        data: {
            displayName
        }
    })
}

export default function EditProfile() {
    const user = useLoaderData<typeof loader>();



    return (
        <>
            <Form method="POST">
                <label htmlFor="displayName">表示名</label>
                <input name="displayName" placeholder="表示名をここに入力" value={user?.displayName || undefined}></input>

                <Button type="submit">送信</Button>
            </Form>
        </>
    );
}