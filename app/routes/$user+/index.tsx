import {LoaderFunctionArgs} from '@remix-run/node';
import {useLoaderData} from '@remix-run/react';
import {Suspense} from 'react';
import {ArticleCardWithLink} from '~/components/ArticleCard';
import {Avatar} from '~/components/Avatar';
import {db} from "~/lib/db.server";

export async function loader({params}: LoaderFunctionArgs) {
    const foundUser = await db.user.findFirst({
        where: {
            name: params.user
        },
        select: {
            name: true,
            displayName: true,
            avatarUrl: true,
            posts: true
        }
    })

    return foundUser
}

export default function Member() {
    const res = useLoaderData<typeof loader>();

    return (
        <div>
            {res ? (
                <div>
                    <div className="bg-white py-10">
                        <div className="flex content-between akari-container flex-col md:flex-row">
                            <div className="flex items-center gap-4 w-full mb-4 md:mb-0">
                                <Avatar
                                    src={res.avatarUrl}
                                    alt={res.name}
                                    size="lg"
                                />
                                <div>
                                    <h2>{res.name}</h2>
                                    {/* <p>{res.member.bio}</p> */}
                                </div>
                            </div>
                            {/* <ul className="flex gap-1 items-center justify-center md:justify-start border-t md:border-t-0 pt-4 md:pt-0">
								{res.member.socials.map((social) => (
									<li key={social.type}>
										<a
											href={social.url}
											target="_blank"
											rel="noreferrer noopener"
											aria-label={`${social.type}のリンクへ移動する`}
										>
											{social.alt ? (
												<EasyTooltip tooltip={social.alt}>
													{getSocialIcon(social.type)}
												</EasyTooltip>
											) : (
												getSocialIcon(social.type)
											)}
										</a>
									</li>
								))}
							</ul> */}
                        </div>
                    </div>
                    <div className="akari-container">
                        <Suspense>
                            <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-4 my-10">
                                {res.posts.map((post) => (
                                    <div key={post.id}>
                                        <ArticleCardWithLink
                                            articleId={post.id}
                                            authorName={res.name}
                                            title={post.title}
                                            emoji={post.emoji}
                                            classes={{root: 'h-full'}}
                                            dateDisplay={post.createdAt}
                                        />
                                    </div>
                                ))}
                            </div>
                        </Suspense>
                    </div>
                </div>
            ) : (
                <div>Member not found</div>
            )}
        </div>
    );
}
