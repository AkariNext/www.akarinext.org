import { useFetcher, useLoaderData, useNavigation } from '@remix-run/react';
import { ActionFunctionArgs, LoaderFunctionArgs } from '@remix-run/node';
import '~/mdx.css';

import { useCallback, useEffect, useState } from 'react';
import { authenticator } from '~/lib/auth.server';
import { action as PreveiwAction } from './article+/preview';
import {
	IconAdjustmentsHorizontal,
	IconArrowBackUp,
	IconBook2,
	IconCaretRight,
	IconCircleDashedCheck,
	IconPencil,
	IconPlayerPlay,
} from '@tabler/icons-react';
import { useMarkdownEditor } from '~/hooks/md';
import { cn } from '~/lib/utils';
import { db } from '~/lib/db.server';
import { z } from 'zod';
import { parseWithZod } from '@conform-to/zod';
import { Post } from '@prisma/client';
import Loader from '~/components/Loader';
import EmojiPicker, { EmojiStyle } from 'emoji-picker-react';
import { ClientOnly } from 'remix-utils/client-only';

const schema = z.object({
	title: z.string(),
	markdown: z.string(),
});

export async function loader({ request, params }: LoaderFunctionArgs) {
	const articleId = params.articleId;
	const user = await authenticator.isAuthenticated(request, {
		failureRedirect: '/login',
	});

	const foundPost = await db.post.findFirst({
		where: {
			id: articleId,
			authors: {
				some: {
					id: user.id,
				},
			},
		},
		include: {
			authors: {
				select: {
					id: true,
					avatarUrl: true,
					displayName: true,
				},
			},
		},
	});

	return foundPost;
}

export async function action({ request, params }: ActionFunctionArgs) {
	const user = await authenticator.isAuthenticated(request, {
		failureRedirect: '/login',
	});


	const articleId = params.articleId;
	if (typeof articleId !== 'string') {
		throw new Error('Invalid articleId');
	}

	const form = await request.formData();

	const submission = parseWithZod(form, { schema });

	if (submission.status !== 'success') {
		return submission.reply();
	}

	const { title, markdown } = submission.value;

	const foundPost = await db.post.findFirst({
		where: {
			id: articleId,
			authors: {
				some: {
					id: user.id,
				},
			},
		},
	});

	let post: Post;
	const include = {
		include: {
			authors: {
				select: {
					id: true,
					avatarUrl: true,
					displayName: true,
				},
			},
		},
	};

	if (foundPost) {
		post = await db.post.update({
			where: {
				id: articleId,
			},
			data: {
				title: title,
				content: markdown,
			},
			...include,
		});
	} else {
		post = await db.post.create({
			data: {
				id: articleId,
				title: title,
				category: 'dev',
				authors: { connect: { id: user.id } },
				content: markdown,
			},
			...include,
		});
	}

	return post;
}

export default function EditArticle() {
	// メインデータ系
	const post = useLoaderData<typeof loader>();

	// フェッチャー系
	const fetcher = useFetcher<typeof action>();
	const previewFetcher = useFetcher<typeof PreveiwAction>();

	// ブログのデータ系
	const [title, setTitle] = useState<undefined | string>(post?.title);
	const [doc, setDoc] = useState<undefined | string>(post?.content);

	// フラグ系
	const [isSaved, setIsSaved] = useState(true);
	const [isPreview, setIsPreview] = useState(false);
	const [enablePageEditBar, setEnablePageEditBar] = useState(false);

	// 動的コンテンツ
	const [previewContent, setPreviewContent] = useState<string>();

	const save = useCallback(() => {
		setIsSaved(true);

		if (!doc || !title) {
			throw new Error('Invalid data');
		}

		fetcher.submit({ markdown: doc, title }, { method: 'POST' });
		setIsSaved(true);
	}, [doc, fetcher, title]);

	useEffect(() => {
		setIsSaved(doc === post?.content);
	}, [isSaved, doc, post]);

	const { editor } = useMarkdownEditor({ doc, setDoc });

	const onEditor = () => {
		setIsPreview(false);
	};

	const onPreview = () => {
		previewFetcher.submit(
			{ markdown: doc || '' },
			{
				action: `/article/preview`,
				encType: 'multipart/form-data',
				method: 'POST',
			},
		);

		setIsPreview(true);
	};

	useEffect(() => {
		if (previewFetcher.data && previewFetcher.data.html) {
			setPreviewContent(previewFetcher.data.html);
		}
	}, [previewFetcher.data]);

	return (
		<div className="relative h-screen flex overflow-x-hidden">
			<div className="w-full">
				<header className="py-4 border-b border-gray-200">
					<div
						className="flex justify-between items-center m-auto"
						style={{
							maxWidth: 'min(1900px, 90%)',
						}}
					>
						<div className="flex">
							<div className="hover:bg-white p-2 rounded-full transition-all cursor-pointer">
								<IconArrowBackUp stroke={2} />
							</div>
						</div>
						<div className="flex items-center">
							<div
								onClick={() => setEnablePageEditBar(!enablePageEditBar)}
								className={cn(
									'flex p-2 rounded-full bg-transparent transition-all hover:cursor-pointer hover:bg-gray-200',
									{
										'bg-gray-200': enablePageEditBar,
									},
								)}
							>
								<IconAdjustmentsHorizontal stroke={2} />
							</div>
							<button
								onClick={save}
								className="rounded-2xl px-2 w-28 py-2 bg-primary text-accent"
							>
								{fetcher.state === 'submitting' ? (
									<div className="flex items-center gap-1 justify-center">
										<Loader /> 保存中
									</div>
								) : isSaved ? (
									'保存済み'
								) : (
									'保存'
								)}
							</button>
						</div>
					</div>
				</header>
				<div className={cn('akari-container py-10')}>
					<input
						value={title}
						onChange={(e) => setTitle(e.target.value)}
						placeholder="Title"
						className="bg-transparent focus-within:outline-none text-2xl mb-4"
					></input>

					<div className="grid sm:grid-cols-1 md:grid-cols-12 gap-4 grid-flow-dense">
						<div className="col-span-10">
							<div
								ref={editor}
								className={cn({ hidden: isPreview === true })}
							></div>
							{previewFetcher.state === 'loading' && (
								<div className="mdx m-0">プレビューを生成中です...</div>
							)}
							{previewFetcher.state !== 'loading' &&
								isPreview &&
								previewContent && (
									<div
										className="mdx m-0"
										dangerouslySetInnerHTML={{ __html: previewContent }}
									></div>
								)}
						</div>
						<div className="relative col-span-2 flex gap-2 h-min bg-white border rounded-full w-min px-2 py-1 items-center">
							<div
								className={cn(
									"absolute h-10 w-10 px-2 py-1 rounded-full z-10 transition-all duration-300 content-['']",
									isPreview ? 'right-2' : 'right-14',
									isPreview ? 'bg-blue-400' : 'bg-gray-200',
								)}
							></div>
							<button
								onClick={onEditor}
								className={cn(
									'flex justify-center items-center h-10 w-10 rounded-full p-2 bg-transparent z-20 text-gray-400',
								)}
							>
								<IconPencil stroke={2} />
							</button>
							<button
								onClick={onPreview}
								className={cn(
									'flex justify-center items-center h-10 w-10 rounded-full p-2 bg-transparent z-20 text-gray-200',
								)}
							>
								<IconPlayerPlay stroke={2} />
							</button>
						</div>
					</div>
				</div>
			</div>
			<div
				className={cn(
					'bg-white h-screen transition-[margin-right] duration-500  absolute md:relative -mr-[35%] w-[35%] right-0 z-40',
					enablePageEditBar && 'mr-0',
				)}
			>
				<div className="mx-auto my-4" style={{ maxWidth: 'min(1200px, 90%)' }}>
					<p className="flex items-center">
						<IconCaretRight stroke={2} />
						公開設定
					</p>
					<div>
						<h2>アイコンを変更</h2>
						<div className="h-16 w-16 rounded-md bg-gray-100">
							<ClientOnly>
								{() => (
									<EmojiPicker
										onEmojiClick={(emojiObject) =>
											console.log(emojiObject.emoji)
										}
									/>
								)}
							</ClientOnly>
						</div>
					</div>
					<div>
						<h5>タグ</h5>
					</div>
					<div>
						<h5>カテゴリー</h5>
						<div className="flex justify-center items-center gap-4 mt-4">
							<div className="relative w-1/2 p-4  rounded-lg cursor-pointer  transition-all duration-75 outline outline-2 outline-blue-400 outline-offset-3 group selected-item">
								<div>
									<IconCircleDashedCheck
										stroke={2}
										className="absolute right-0 top-0 text-blue-400 hidden group-[.selected-item]:block"
									/>
								</div>
								<div>
									Tech
									<p>プログラミング、技術、開発に関する記事</p>
								</div>
							</div>
							<div className="relative w-1/2 p-4  rounded-lg cursor-pointer  transition-all duration-75">
								<div>
									<h3 className="flex items-center">
										<IconBook2 stroke={2} />
										Blog
									</h3>
									<p>日記、雑記、その他の記事</p>
								</div>
							</div>
						</div>
					</div>
				</div>
			</div>
		</div>
	);
}
