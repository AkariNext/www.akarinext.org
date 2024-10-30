import { useFetcher } from '@remix-run/react';
import {
	ActionFunctionArgs,
	unstable_parseMultipartFormData,
} from '@remix-run/node';
import '~/mdx.css';

import {
	ClipboardEventHandler,
	useCallback,
	useEffect,
	useRef,
	useState,
} from 'react';
import { uploadHandler } from '~/lib/s3.server';
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

export async function action({ request }: ActionFunctionArgs) {
	
	const user = await authenticator.isAuthenticated(request, {
		failureRedirect: '/login',
	});

	const uploader = uploadHandler(user.id, ['image/jpeg', 'image/png']);
	const formData = await unstable_parseMultipartFormData(
		request,
		uploader.s3UploadHandler,
	);

	const url = formData.get('file');
	return {
		fileName: 'fileName',
		url,
	};
}

export default function EditArticle() {
	const fetcher = useFetcher<typeof action>();
	const previewFetcher = useFetcher<typeof PreveiwAction>();
	const [text, setText] = useState('');
	const textareaRef = useRef<HTMLTextAreaElement>(null);
	const [previewContent, setPreviewContent] = useState<string>();
	const [doc, setDoc] = useState<null | string>(null);
	const [isPreview, setIsPreview] = useState(false);
	const [enablePageEditBar, setEnablePageEditBar] = useState(false);
	const save = useCallback(() => {
		// ここでdocを保存する
	}, [doc]);

	const { editor } = useMarkdownEditor({ doc, setDoc });

	const handlePaste: ClipboardEventHandler<HTMLTextAreaElement> = async (
		event,
	) => {
		const items = event.clipboardData?.items || [];
		for (let item of items) {
			if (item.kind === 'file') {
				const file = item.getAsFile();
				if (!file) {
					continue;
				}
				await uploadFile(file);
			}
		}
	};

	const uploadFile = async (file: File) => {
		const formData = new FormData();
		formData.append('file', file);

		fetcher.submit(formData, {
			method: 'post',
			encType: 'multipart/form-data',
		});
	};

	const onEditor = () => {
		setIsPreview(false);
	};

	const onPreview = () => {
		previewFetcher.submit(
			{ markdown: doc },
			{
				action: `/article/preview`,
				encType: 'multipart/form-data',
				method: 'POST',
			},
		);

		setIsPreview(true);
	};

	const insertLink = (link: string) => {
		const textarea = textareaRef.current;

		if (!textarea) {
			return;
		}

		const start = textarea.selectionStart;
		const end = textarea.selectionEnd;

		// 現在のテキストを更新
		const newText = text.substring(0, start) + link + text.substring(end);
		setText(newText);

		// カーソル位置を更新
		setTimeout(() => {
			textarea.selectionStart = textarea.selectionEnd = start + link.length;
			textarea.focus();
		}, 0);
	};

	useEffect(() => {
		if (fetcher.data && fetcher.data.url) {
			console.log(fetcher.data.url);
			const fileName = fetcher.data.fileName!; // サーバーからファイル名を取得
			insertLink(`![${fileName}](${fetcher.data.url})`);
		}
	}, [fetcher.data]);

	useEffect(() => {
		if (previewFetcher.data && previewFetcher.data.html) {
			setPreviewContent(previewFetcher.data.html);
		}
	}, [previewFetcher.data]);

	return (
		<div className="relative h-screen flex overflow-x-hidden">
			<div
				className="w-full"
			// className={cn('translate-x-0 transition-all', {
			// 	'-translate-x-80': enablePageEditBar,
			// })}
			>
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
						<div
							onClick={() => setEnablePageEditBar(!enablePageEditBar)}
							className={cn('flex p-2 rounded-full bg-transparent transition-all hover:cursor-pointer hover:bg-gray-200', {
								'bg-gray-200': enablePageEditBar,
							})}
						>
							<IconAdjustmentsHorizontal stroke={2} />
						</div>
					</div>
				</header>
				<div className={cn('akari-container py-10')}>
					<input
						placeholder="Title"
						className="bg-transparent focus-within:outline-none text-2xl mb-4"
					></input>

					<div className="grid sm:grid-cols-1 md:grid-cols-12 gap-4 grid-flow-dense">
						<div className="col-span-10">
							{
								<div
									ref={editor}
									className={cn({ hidden: isPreview === true })}
								></div>
							}
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
									'absolute h-10 w-10 px-2 py-1 rounded-full z-10 transition-all duration-300',
									isPreview ? 'right-2' : 'right-14',
									isPreview ? 'bg-blue-400' : 'bg-gray-200',
								)}
								style={{ content: '' }}
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
					<p className='flex items-center'>
						<IconCaretRight stroke={2} />
						公開設定</p>
					<div>
						<p>アイコンを変更</p>
					</div>
					<div>
						<h5>タグ</h5>
					</div>
					<div>
						<h5>カテゴリー</h5>
						<div className='flex justify-center items-center gap-4 mt-4'>
							<div className='relative w-1/2 p-4  rounded-lg cursor-pointer  transition-all duration-75 outline outline-2 outline-blue-400 outline-offset-3 group selected-item'>
								<div>
									<IconCircleDashedCheck stroke={2} className='absolute right-0 top-0 text-blue-400 hidden group-[.selected-item]:block' />
								</div>
								<div>
									Tech
									<p>
										プログラミング、技術、開発に関する記事
									</p>
								</div>
							</div>
							<div className='relative w-1/2 p-4  rounded-lg cursor-pointer  transition-all duration-75'>
								<div>
									<h3 className='flex items-center'>
									<IconBook2 stroke={2} />
									Blog
									</h3>
									<p>
										日記、雑記、その他の記事
									</p>
								</div>
							</div>
						</div>
					</div>
				</div>
			</div>
		</div>
	);
}
