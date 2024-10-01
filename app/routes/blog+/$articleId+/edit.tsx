import { useFetcher } from '@remix-run/react';
import {
	ActionFunctionArgs,
	unstable_parseMultipartFormData,
} from '@remix-run/node';
import '~/mdx.css';

import { useEffect, useRef, useState } from 'react';
import { uploadHandler } from '~/lib/s3.server';
import { authenticator } from '~/lib/auth.server';
import { v4 as uuidv4 } from 'uuid';
import { action as PreveiwAction } from '../preview';

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

	const handlePaste = async (event) => {
		const items = event.clipboardData.items;
		for (let item of items) {
			if (item.kind === 'file') {
				const file = item.getAsFile();
				await uploadFile(file);
			}
		}
	};

	const uploadFile = async (file) => {
		const formData = new FormData();
		formData.append('file', file);
		const newMarker = uuidv4();

		fetcher.submit(formData, {
			method: 'post',
			encType: 'multipart/form-data',
		});

		return newMarker;
	};

	const onPreview = () => {
		previewFetcher.submit(
			{ markdown: text },
			{
				action: `/blog/preview`,
				encType: 'multipart/form-data',
				method: 'POST',
			},
		);
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
		<>
			<textarea
				ref={textareaRef}
				value={text}
				onChange={(e) => setText(e.target.value)}
				onPaste={handlePaste}
				rows={10}
				cols={50}
			/>
			{previewContent && (
				<div
					className="mdx"
					dangerouslySetInnerHTML={{ __html: previewContent }}
				></div>
			)}
			<button onClick={onPreview}>💩</button>
		</>
	);
}
