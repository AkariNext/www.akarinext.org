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
import { action as PreveiwAction } from './blog+/preview';
import { IconPencil, IconPlayerPlay } from '@tabler/icons-react';
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
				action: `/blog/preview`,
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
		<div className="akari-container py-10">
			<input placeholder="Title" className='bg-transparent focus-within:outline-none text-2xl mb-4'></input>

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
	);
}
