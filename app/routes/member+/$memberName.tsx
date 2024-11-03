import { LoaderFunctionArgs } from '@remix-run/node';
import { Await, useLoaderData } from '@remix-run/react';
import { Suspense } from 'react';
import { ArticleCard, ArticleCardWithLink } from '~/components/ArticleCard';
import { Avatar } from '~/components/Avatar';
import EasyTooltip from '~/components/Tooltip';
import { getBlogPostListingsByUsername } from '~/lib/blog.server';
import { MEMBERS } from '~/lib/member.server';
import { getSocialIcon } from '~/lib/utils';

export async function loader({ params }: LoaderFunctionArgs) {
	const foundMember = MEMBERS.find((m) => m.name === params.memberName);

	const posts = getBlogPostListingsByUsername(params.memberName!);

	return foundMember ? { member: foundMember, posts } : null;
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
									src={res.member.avatar}
									alt={res.member.name}
									size="lg"
								/>
								<div>
									<h2>{res.member.name}</h2>
									<p>{res.member.bio}</p>
								</div>
							</div>
							<ul className="flex gap-1 items-center justify-center md:justify-start border-t md:border-t-0 pt-4 md:pt-0">
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
							</ul>
						</div>
					</div>
					<div className="akari-container">
						<Suspense>
							<div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-4 my-10">
								<Await resolve={res.posts}>
									{(posts) => (
										<>
											{posts.map((post) => (
												<div key={post.slug}>
													<ArticleCardWithLink
														title={post.title}
														emoji={post.emoji}
														classes={{ root: 'h-full' }}
														slug={post.slug}
														dateDisplay={post.dateDisplay}
													/>
												</div>
											))}
										</>
									)}
								</Await>
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
