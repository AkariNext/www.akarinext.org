import { InlineIcon } from '@iconify/react/dist/iconify.js';
import { NavLink } from '@remix-run/react';
import { cn } from '~/lib/utils';

export type ArticleCardProps = {
	title: string;
	emoji: string;
	dateDisplay: string;
	classes?: { root: string };
	isTransitioning?: boolean;
};

export function ArticleCard({
	title,
	emoji,
	dateDisplay,
	classes,
	isTransitioning,
}: ArticleCardProps) {
	return (
		<div
			className={cn(
				'bg-white border rounded-xl flex flex-col justify-between',
				classes?.root,
			)}
		>
			<div className="flex items-center flex-col bg-primary py-8 rounded-t-xl">
				<div className="flex items-center justify-center h-20 w-20 rounded-full bg-blue-100">
					<InlineIcon
						icon={`fluent-emoji-flat:${emoji}`}
						className="h-20 w-20 bg-white p-2 rounded-lg"
						style={
							isTransitioning ? { viewTransitionName: 'blog-image' } : undefined
						}
					/>
				</div>
			</div>
			<div className="flex flex-col flex-grow p-4">
				<h2
					className="text-lg font-semibold text-gray-800"
					style={
						isTransitioning ? { viewTransitionName: 'blog-title' } : undefined
					}
				>
					{title}
				</h2>
				<div className="flex-grow"></div>
				<p className="text-gray-600 pt-8 select-none">{dateDisplay}</p>
			</div>
		</div>
	);
}

export function ArticleCardWithLink({
	title,
	emoji,
	dateDisplay,
	classes,
	articleId,
	authorName,
}: ArticleCardProps & { articleId: string, authorName: string }) {
	return (
		<NavLink to={`/${authorName}/articles/${articleId}`} viewTransition prefetch="intent">
			{({ isTransitioning }) => (
				<ArticleCard
					title={title}
					emoji={emoji}
					dateDisplay={dateDisplay}
					classes={classes}
					isTransitioning={isTransitioning}
				/>
			)}
		</NavLink>
	);
}
