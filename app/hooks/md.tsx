import { useMemo, useEffect, useRef, useState } from 'react';

import { EditorView, keymap, ViewUpdate, placeholder } from '@codemirror/view';
import { EditorState, StateEffect } from '@codemirror/state';
import { defaultKeymap, indentWithTab } from '@codemirror/commands';
import { markdown, markdownLanguage } from '@codemirror/lang-markdown';
import { syntaxHighlighting, HighlightStyle } from '@codemirror/language';
import { tags } from '@lezer/highlight';
import { useFetcher } from '@remix-run/react';
import { action } from '~/routes/api+/upload.$tracker';
import { v4 as uuidv4 } from 'uuid';

export const useMarkdownEditor = ({ doc, setDoc }: UseMarkdownEditorProps) => {
	const editor = useRef(null); // EditorViewの親要素のref
	const [container, setContainer] = useState<HTMLDivElement>();
	const [view, setView] = useState<EditorView>();
	const fetcher = useFetcher<typeof action>();
	const [uploadingImages, setUploadingImages] = useState<{ [key: string]: { cursorPos: number | null } }>({});


	const imageUpload = async (files: File[], cursorPos: number | null) => {
		const formData = new FormData();

		files.forEach((file) => {
			formData.append('file', file);
		});

		const tracker = uuidv4();
		fetcher.submit(formData, {
			action: `/api/upload/${tracker}`,
			method: 'post',
			encType: 'multipart/form-data',
		});

		setUploadingImages({
			...uploadingImages,
			[tracker]: { cursorPos },
		});
	};

	const insertText = (url: string, cursorPos: number | null) => {
		if (!view) return;

		const insertText = `\n![](${url})`;
		const transaction = view.state.update({
			changes: {
				from: cursorPos || 0,
				insert: insertText,
			},
		});
		view.dispatch(transaction);
	};

	useEffect(() => {
		if (!fetcher.data) return;

		const { urls, tracker } = fetcher.data;
		const { cursorPos } = uploadingImages[tracker] || {};
		for (const url of urls) {
			insertText(url, cursorPos);
		}
	}, [fetcher.data]);

	// Editor内で発生するイベントのハンドラー（extensionsに追加する）
	const eventHandlers = useMemo(
		() =>
			EditorView.domEventHandlers({
				// 画像ファイルがドラッグ＆ドロップされたときの処理
				// ref: https://developer.mozilla.org/ja/docs/Web/API/HTML_Drag_and_Drop_API/File_drag_and_drop#%E3%83%89%E3%83%AD%E3%83%83%E3%83%97%E3%81%AE%E5%87%A6%E7%90%86
				drop(event, view) {
					if (!event.dataTransfer) return;

					// eventが発生したカーソルの位置を取得する
					const cursorPos = view.posAtCoords({
						x: event.pageX,
						y: event.pageY,
					});

					// DataTransferItemList インターフェイスを使用して、ファイルにアクセスする
					if (event.dataTransfer.items) {
						let files = Object.values(event.dataTransfer.items).map((item) => item.getAsFile()).filter((file) => file) as File[];
						imageUpload(files, cursorPos)						
					} else {
						// DataTransfer インターフェイスを使用してファイルにアクセスする
						for (let i = 0; i < event.dataTransfer.files.length; i++) {
							const file = event.dataTransfer.files[i];

							imageUpload([file], cursorPos);
						}
					}
				},

				// 画像ファイルがペーストされたときの処理
				paste(event, view) {
					console.log(event.clipboardData, "ペースト");
					if (!event.clipboardData?.files?.length) return;

					const files = Object.values(event.clipboardData.files) as File[];
					imageUpload(files, view.state.selection.main.head);
				},
			}),
		[imageUpload]
	);

	// const customKeymap = useMemo(() => {
	// 	return keymap.of([
	// 		{
	// 			key: 'Enter',
	// 			run(e) {
	// 				return true;
	// 			},
	// 		},
	// 	]);
	// });

	useEffect(() => {
		if (editor.current) {
			setContainer(editor.current);
		}
	}, [setContainer]);

	// Editorの状態が更新されたときの処理
	const updateListener = useMemo(() => {
		return EditorView.updateListener.of((update: ViewUpdate) => {
			if (update.docChanged) {
				// エディタのテキストが更新されるたびにdocを更新する
				setDoc(update.state.doc.toString());
			}
		});
	}, [setDoc]);

	const highlightStyle = HighlightStyle.define([
		{
			tag: tags.heading1,
			color: 'black',
			fontSize: '1.4em',
			fontWeight: '700',
		},
		{
			tag: tags.heading2,
			color: 'black',
			fontSize: '1.3em',
			fontWeight: '700',
		},
		{
			tag: tags.heading3,
			color: 'black',
			fontSize: '1.2em',
			fontWeight: '700',
		},
		{
			tag: tags.heading4,
			color: 'black',
			fontSize: '1.1em',
			fontWeight: '700',
		},
		{ tag: tags.strong, color: 'black', fontWeight: '700' }, // 太字
		{ tag: tags.quote, color: '#6a737d' }, // 引用
		{ tag: tags.emphasis, fontStyle: 'italic' }, // 斜体
		{ tag: tags.url, textDecoration: 'underline' }, // URLに下線をつける
		{ tag: tags.strikethrough, textDecoration: 'line-through' }, // 打ち消し線（GFM拡張）
	]);

	const extensions = useMemo(() => {
		return [
			syntaxHighlighting(highlightStyle),
			markdown({
				base: markdownLanguage,
				completeHTMLTags: false,
			}),
			placeholder('Write with Markdown'),
			updateListener,
			eventHandlers,
			keymap.of([indentWithTab, ...defaultKeymap]),
		];
	}, [updateListener, defaultKeymap]);

	// viewを初期化する
	useEffect(() => {
		if (!view && container) {
			const state = EditorState.create({
				doc, // エディタの初期値としてdocを設定する
				extensions: [updateListener],
			});
			const viewCurrent = new EditorView({
				state,
				parent: container,
			});
			setView(viewCurrent);
		}
	}, [view, container, doc, updateListener]);

	useEffect(() => {
		if (view) {
			view.dispatch({ effects: StateEffect.reconfigure.of(extensions) });
		}
	}, [view, extensions]);

	return {
		editor,
	};
};
