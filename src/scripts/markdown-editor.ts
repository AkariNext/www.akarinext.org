/**
 * 記事本文の編集欄（CodeMirror 6）。
 *
 * 元の textarea は消さずに hidden で残し、内容を書き戻す。
 * name="content" のまま普通にフォーム送信でき、JS が落ちても入力が失われない。
 */

import {
	defaultKeymap,
	history,
	historyKeymap,
	indentWithTab,
} from "@codemirror/commands";
import { markdown, markdownKeymap } from "@codemirror/lang-markdown";
import {
	HighlightStyle,
	indentUnit,
	syntaxHighlighting,
} from "@codemirror/language";
import {
	EditorSelection,
	EditorState,
	type Extension,
} from "@codemirror/state";
import { EditorView, keymap, placeholder } from "@codemirror/view";
import { tags } from "@lezer/highlight";

/** サイトのトークンに合わせた配色。CSS 変数なので明暗の切り替えに追従する */
const highlight = HighlightStyle.define([
	{ tag: tags.heading, color: "var(--color-ink)", fontWeight: "700" },
	{ tag: tags.strong, color: "var(--color-ink)", fontWeight: "700" },
	{ tag: tags.emphasis, color: "var(--color-ink)", fontStyle: "italic" },
	{ tag: tags.link, color: "var(--color-accent)" },
	{ tag: tags.url, color: "var(--color-accent)" },
	{ tag: tags.monospace, color: "var(--color-accent)" },
	{ tag: tags.quote, color: "var(--color-ink-2)", fontStyle: "italic" },
	{ tag: tags.list, color: "var(--color-accent)" },
	{ tag: tags.strikethrough, textDecoration: "line-through" },
	// 記号（#, *, ` など）は本文より薄く落として、文章を読みやすくする
	{ tag: tags.processingInstruction, color: "var(--color-muted)" },
	{ tag: tags.meta, color: "var(--color-muted)" },
]);

const theme = EditorView.theme({
	"&": {
		height: "100%",
		color: "var(--color-ink)",
		backgroundColor: "var(--color-paper)",
		border: "var(--rule-hair) solid var(--color-rule-strong)",
		borderRadius: "var(--radius-sm)",
		fontSize: "1rem",
	},
	"&.cm-focused": {
		outline: "var(--rule-medium) solid var(--color-focus)",
		outlineOffset: "var(--space-3xs)",
	},
	".cm-scroller": {
		// 記号や英数字は等幅で。プロポーショナルだと ``` や記号が詰まって読めない。
		// 日本語は等幅フォントに字形が無いので、本文と同じ書体に落ちる
		fontFamily: 'var(--font-mono), "Zen Kaku Gothic New", monospace',
		fontSize: "0.95rem",
		lineHeight: "1.9",
		padding: "var(--space-md) var(--space-lg)",
	},
	".cm-content": { caretColor: "var(--color-ink)" },
	".cm-cursor, .cm-dropCursor": { borderLeftColor: "var(--color-ink)" },
	"&.cm-focused .cm-selectionBackground, .cm-selectionBackground, ::selection":
		{
			backgroundColor: "var(--color-paper-3)",
		},
	".cm-placeholder": { color: "var(--color-muted)" },
	".cm-line": { padding: "0" },
});

/** 選択範囲を before/after で囲む。既に囲まれていれば外す（トグル） */
function wrap(
	view: EditorView,
	before: string,
	after: string,
	hint: string,
): boolean {
	const { state } = view;
	view.dispatch(
		state.changeByRange((range) => {
			const selected = state.sliceDoc(range.from, range.to);
			const outerFrom = range.from - before.length;
			const outerTo = range.to + after.length;
			const wrapped =
				outerFrom >= 0 &&
				outerTo <= state.doc.length &&
				state.sliceDoc(outerFrom, range.from) === before &&
				state.sliceDoc(range.to, outerTo) === after;

			if (wrapped) {
				return {
					changes: [
						{ from: outerFrom, to: range.from },
						{ from: range.to, to: outerTo },
					],
					range: EditorSelection.range(outerFrom, outerFrom + selected.length),
				};
			}

			const body = selected || hint;
			const start = range.from + before.length;
			return {
				changes: {
					from: range.from,
					to: range.to,
					insert: before + body + after,
				},
				range: EditorSelection.range(start, start + body.length),
			};
		}),
		{ scrollIntoView: true },
	);
	view.focus();
	return true;
}

/** 選択している行の先頭に marker を付ける。既に付いていれば外す */
function toggleLinePrefix(view: EditorView, marker: string): boolean {
	const { state } = view;
	const changes: { from: number; to: number; insert: string }[] = [];
	const seen = new Set<number>();

	for (const range of state.selection.ranges) {
		const first = state.doc.lineAt(range.from).number;
		const last = state.doc.lineAt(range.to).number;
		for (let n = first; n <= last; n++) {
			if (seen.has(n)) continue;
			seen.add(n);
			const line = state.doc.line(n);
			if (line.text.startsWith(marker)) {
				changes.push({
					from: line.from,
					to: line.from + marker.length,
					insert: "",
				});
			} else {
				changes.push({ from: line.from, to: line.from, insert: marker });
			}
		}
	}
	view.dispatch({ changes });
	view.focus();
	return true;
}

/** 選択範囲をコードブロックで囲む */
function fence(view: EditorView): boolean {
	const { state } = view;
	view.dispatch(
		state.changeByRange((range) => {
			const selected = state.sliceDoc(range.from, range.to);
			const body = selected || "";
			const insert = `\`\`\`\n${body}\n\`\`\``;
			return {
				changes: { from: range.from, to: range.to, insert },
				// 言語名を書き足せるよう、開きフェンスの末尾にカーソルを置く
				range: EditorSelection.cursor(range.from + 3),
			};
		}),
	);
	view.focus();
	return true;
}

/** ツールバーから呼ぶ操作。キーボードショートカットと同じ実装を使う */
export const editorCommands = {
	bold: (view: EditorView) => wrap(view, "**", "**", "太字"),
	italic: (view: EditorView) => wrap(view, "*", "*", "斜体"),
	link: (view: EditorView) => wrap(view, "[", "](url)", "リンク"),
	heading: (view: EditorView) => toggleLinePrefix(view, "## "),
	list: (view: EditorView) => toggleLinePrefix(view, "- "),
	quote: (view: EditorView) => toggleLinePrefix(view, "> "),
	code: (view: EditorView) => fence(view),
} satisfies Record<string, (view: EditorView) => boolean>;

interface EditorOptions {
	/** 値を保持する textarea。hidden にして残し、フォーム送信に使う */
	textarea: HTMLTextAreaElement;
	/** CodeMirror を差し込む親要素 */
	parent: HTMLElement;
	/** 内容が変わったときに呼ばれる（プレビュー更新用） */
	onChange?: () => void;
	/** 画像をアップロードして URL を返す。失敗時は null */
	uploadImage?: (file: File) => Promise<string | null>;
}

export function createMarkdownEditor(options: EditorOptions): EditorView {
	const { textarea, parent, onChange, uploadImage: upload } = options;

	/** 貼り付けた画像を仮の文字列に置き換え、アップロード後に差し替える */
	const insertImage = async (view: EditorView, file: File) => {
		const token = `![アップロード中… ${Date.now()}]()`;
		view.dispatch(view.state.replaceSelection(token));
		onChange?.();

		const url = upload ? await upload(file) : null;
		const at = view.state.doc.toString().indexOf(token);
		if (at === -1) return; // 書き換えられていたら諦める
		view.dispatch({
			changes: {
				from: at,
				to: at + token.length,
				insert: url ? `![${file.name.replace(/\.[^.]+$/, "")}](${url})` : "",
			},
		});
		onChange?.();
	};

	const imagesFrom = (list: FileList | null | undefined): File[] =>
		Array.from(list ?? []).filter((file) => file.type.startsWith("image/"));

	const extensions: Extension[] = [
		history(),
		markdown(),
		syntaxHighlighting(highlight),
		theme,
		EditorView.lineWrapping,
		indentUnit.of("  "),
		placeholder(textarea.placeholder),
		// 先に書いたものが優先される。既定のキーを上書きする分は前に置く
		keymap.of([
			{ key: "Mod-b", run: (view) => wrap(view, "**", "**", "太字") },
			{ key: "Mod-i", run: (view) => wrap(view, "*", "*", "斜体") },
			{ key: "Mod-k", run: (view) => wrap(view, "[", "](url)", "リンク") },
			// Tab をエディタが受け取ると、キーボードだけでは抜け出せなくなる。
			// Escape をその出口にする（既定の選択範囲の単純化より優先する）
			{
				key: "Escape",
				run: (view) => {
					view.contentDOM.blur();
					return true;
				},
			},
			// Tab は既定ではブラウザに渡され、フォーカスが次の要素へ飛ぶ。
			// 書いている途中で入力欄から追い出されるので、インデントに使う
			indentWithTab,
			// リストや引用の継続、マーカーの削除はここが持っている
			...markdownKeymap,
			...historyKeymap,
			...defaultKeymap,
		]),
		EditorView.updateListener.of((update) => {
			if (!update.docChanged) return;
			// 送信されるのは常に textarea の値
			textarea.value = update.state.doc.toString();
			onChange?.();
		}),
		EditorView.domEventHandlers({
			paste(event, view) {
				const files = imagesFrom(event.clipboardData?.files);
				if (!upload || files.length === 0) return false;
				event.preventDefault();
				for (const file of files) void insertImage(view, file);
				return true;
			},
			dragover(event) {
				if (imagesFrom(event.dataTransfer?.files).length > 0) {
					event.preventDefault();
					return true;
				}
				return false;
			},
			drop(event, view) {
				const files = imagesFrom(event.dataTransfer?.files);
				if (!upload || files.length === 0) return false;
				event.preventDefault();
				for (const file of files) void insertImage(view, file);
				return true;
			},
		}),
	];

	const view = new EditorView({
		state: EditorState.create({ doc: textarea.value, extensions }),
		parent,
	});

	// textarea は値の入れ物として残す。表示は CodeMirror が受け持つ
	textarea.hidden = true;
	textarea.setAttribute("aria-hidden", "true");
	textarea.tabIndex = -1;

	return view;
}

/**
 * 書いている位置に合わせてプレビューをスクロールさせる。
 * 双方向にすると互いを動かし合うので、エディタ側だけを起点にする。
 */
export function syncScroll(view: EditorView, preview: HTMLElement): void {
	view.scrollDOM.addEventListener("scroll", () => {
		const scrollable =
			view.scrollDOM.scrollHeight - view.scrollDOM.clientHeight;
		if (scrollable <= 0) return;
		const ratio = view.scrollDOM.scrollTop / scrollable;
		preview.scrollTop = ratio * (preview.scrollHeight - preview.clientHeight);
	});
}
