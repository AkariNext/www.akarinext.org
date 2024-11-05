import { db } from "~/lib/db.server";
import { authenticator } from "~/lib/auth.server";
import { LoaderFunctionArgs } from "@remix-run/node";
import { Link, useLoaderData } from "@remix-run/react";
import { IconPencil, IconPlayerPlay } from "@tabler/icons-react";
import { cn, dateToFormatString } from "~/lib/utils";

export async function loader({ request }: LoaderFunctionArgs) {
    const user = await authenticator.isAuthenticated(request, {
        failureRedirect: '/login'
    });

    return db.post.findMany({
        where: {
            authorId: user.id
        },
        orderBy: {
            createdAt: 'desc'
        },
        include: {
            author: {
                select: {
                    name: true
                }
            }
        }
    })
}

export default function ArticlesRoute() {
    const articles = useLoaderData<typeof loader>()

    return (
        <>
            <section className="mb-4">

                <h1>記事の管理</h1>
            </section>

            <section>
                <ul className="flex flex-col">
                    {articles.map((article, i) => <li key={article.id} className={cn("border-b py-4", articles.length - 1 === i && "border-b-0")}>
                        <div>
                            <div className="flex justify-between">
                                <h3>
                                    {article.title}
                                </h3>
                                <div className="flex gap-2">
                                    <Link to={`/${article.author.name}/articles/${article.id}`} className="cursor-pointer">
                                        <IconPlayerPlay className="bg-gray-100 text-slate-800 w-8 h-8 p-1 rounded-full" />
                                    </Link>
                                    <Link to={`/articles/${article.id}/edit`} className="cursor-pointer">
                                        <IconPencil className="bg-gray-100 text-slate-800 p-1 w-8 h-8 rounded-full" />
                                    </Link>
                                </div>
                            </div>
                            <div>
                                <p className="text-sm text-gray-400">{dateToFormatString(article.createdAt)}</p>
                            </div>
                        </div>
                    </li>)}
                </ul>
            </section>
        </>
    )
}