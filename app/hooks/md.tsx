import { useMemo, useEffect, useRef, useState } from 'react';

import { EditorView, keymap, ViewUpdate, placeholder } from '@codemirror/view';
import { EditorState, StateEffect } from '@codemirror/state';
import { defaultKeymap, indentWithTab } from '@codemirror/commands';
import { markdown, markdownLanguage } from '@codemirror/lang-markdown';
import { syntaxHighlighting, HighlightStyle } from '@codemirror/language';
import { tags } from '@lezer/highlight';

export const useMarkdownEditor = ({ doc, setDoc }: UseMarkdownEditorProps) => {
	const editor = useRef(null); // EditorViewの親要素のref
	const [container, setContainer] = useState<HTMLDivElement>();
	const [view, setView] = useState<EditorView>();

	const customKeymap = useMemo(() => {
		return keymap.of([
			{
				key: 'Enter',
				run(e) {
					return true;
				},
			},
		]);
	});

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
