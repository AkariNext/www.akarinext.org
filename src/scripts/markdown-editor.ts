/**
 * textarea を Markdown 向けに補助する。
 *
 * WYSIWYG には置き換えず、あくまで素の textarea のまま。
 * フォーム送信も IME も既存の挙動をそのまま使えるのが利点で、
 * 代わりに書いている最中の手間だけを減らす。
 */

/** 挿入は execCommand 経由にする。setRangeText だと undo 履歴が壊れるため */
function insert(textarea: HTMLTextAreaElement, text: string): void {
	textarea.focus();
	const ok = document.execCommand?.("insertText", false, text);
	if (ok) return;

	// execCommand が使えない環境向けのフォールバック（undo は効かなくなる）
	const { selectionStart, selectionEnd } = textarea;
	textarea.setRangeText(text, selectionStart, selectionEnd, "end");
	textarea.dispatchEvent(new Event("input", { bubbles: true }));
}

/** カーソル行の範囲を返す */
function currentLine(textarea: HTMLTextAreaElement): {
	start: number;
	end: number;
	text: string;
} {
	const value = textarea.value;
	const start = value.lastIndexOf("\n", textarea.selectionStart - 1) + 1;
	const lineEnd = value.indexOf("\n", textarea.selectionStart);
	const end = lineEnd === -1 ? value.length : lineEnd;
	return { start, end, text: value.slice(start, end) };
}

/** 箇条書き・番号付き・引用・チェックボックスの行頭マーカー */
const MARKER = /^(\s*)(?:([-*+])\s+(\[[ xX]\]\s+)?|(\d+)([.)])\s+|(>)\s?)/;

/** Enter でリストや引用を続ける。空の項目なら解除する */
function continueList(
	textarea: HTMLTextAreaElement,
	event: KeyboardEvent,
): void {
	if (event.shiftKey || event.isComposing) return;
	if (textarea.selectionStart !== textarea.selectionEnd) return;

	const line = currentLine(textarea);
	const match = line.text.match(MARKER);
	if (!match) return;

	const [marker, indent, bullet, checkbox, number, delimiter, quote] = match;

	// マーカーだけで中身が空なら、続けずに解除する
	if (line.text.trim() === marker.trim()) {
		event.preventDefault();
		textarea.setSelectionRange(line.start, line.end);
		insert(textarea, indent);
		return;
	}

	event.preventDefault();
	let next: string;
	if (number) {
		next = `${indent}${Number(number) + 1}${delimiter} `;
	} else if (bullet) {
		// チェックボックスは未チェックの状態で引き継ぐ
		next = `${indent}${bullet} ${checkbox ? "[ ] " : ""}`;
	} else {
		next = `${indent}${quote} `;
	}
	insert(textarea, `\n${next}`);
}

/** 選択範囲を before/after で囲む。選択がなければ間にカーソルを置く */
function wrap(
	textarea: HTMLTextAreaElement,
	before: string,
	after: string,
	placeholder = "",
): void {
	const { selectionStart, selectionEnd, value } = textarea;
	const selected = value.slice(selectionStart, selectionEnd);

	// 既に囲まれていれば外す（トグル）
	const outerStart = selectionStart - before.length;
	if (
		outerStart >= 0 &&
		value.slice(outerStart, selectionStart) === before &&
		value.slice(selectionEnd, selectionEnd + after.length) === after
	) {
		textarea.setSelectionRange(outerStart, selectionEnd + after.length);
		insert(textarea, selected);
		textarea.setSelectionRange(outerStart, outerStart + selected.length);
		return;
	}

	const body = selected || placeholder;
	insert(textarea, `${before}${body}${after}`);
	if (selected) {
		const end = selectionStart + before.length + body.length;
		textarea.setSelectionRange(selectionStart + before.length, end);
	} else {
		// 中身が空なら、書き始められる位置にカーソルを置く
		const caret = selectionStart + before.length;
		textarea.setSelectionRange(caret, caret + placeholder.length);
	}
}

interface EnhanceOptions {
	/** 画像をアップロードして URL を返す。失敗時は null */
	uploadImage?: (file: File) => Promise<string | null>;
	/** 内容が変わったときに呼ばれる（プレビュー更新用） */
	onChange?: () => void;
}

export function enhanceMarkdownEditor(
	textarea: HTMLTextAreaElement,
	options: EnhanceOptions = {},
): void {
	textarea.addEventListener("keydown", (event) => {
		const modifier = event.metaKey || event.ctrlKey;

		if (event.key === "Enter" && !modifier) {
			continueList(textarea, event);
			return;
		}
		if (!modifier || event.altKey) return;

		switch (event.key.toLowerCase()) {
			case "b":
				event.preventDefault();
				wrap(textarea, "**", "**", "太字");
				break;
			case "i":
				event.preventDefault();
				wrap(textarea, "*", "*", "斜体");
				break;
			case "k":
				event.preventDefault();
				wrap(textarea, "[", "](url)", "リンク");
				break;
			default:
				return;
		}
		options.onChange?.();
	});

	const upload = options.uploadImage;
	if (!upload) return;

	/** アップロード中は仮のテキストを置き、終わったら差し替える */
	const insertImage = async (file: File): Promise<void> => {
		const token = `![アップロード中… ${Date.now()}]()`;
		insert(textarea, token);
		options.onChange?.();

		const url = await upload(file);
		const replacement = url
			? `![${file.name.replace(/\.[^.]+$/, "")}](${url})`
			: "";
		const at = textarea.value.indexOf(token);
		if (at === -1) return; // 書き換えられていたら諦める
		textarea.setSelectionRange(at, at + token.length);
		insert(textarea, replacement);
		options.onChange?.();
	};

	const imagesFrom = (list: FileList | null | undefined): File[] =>
		Array.from(list ?? []).filter((f) => f.type.startsWith("image/"));

	textarea.addEventListener("paste", (event) => {
		const files = imagesFrom(event.clipboardData?.files);
		if (files.length === 0) return;
		event.preventDefault();
		for (const file of files) void insertImage(file);
	});

	textarea.addEventListener("dragover", (event) => {
		if (imagesFrom(event.dataTransfer?.files).length > 0)
			event.preventDefault();
	});

	textarea.addEventListener("drop", (event) => {
		const files = imagesFrom(event.dataTransfer?.files);
		if (files.length === 0) return;
		event.preventDefault();
		for (const file of files) void insertImage(file);
	});
}

/**
 * 書いている位置に合わせてプレビューをスクロールさせる。
 * 双方向にすると互いを動かし合うので、textarea 側だけを起点にする。
 */
export function syncScroll(
	textarea: HTMLTextAreaElement,
	preview: HTMLElement,
): void {
	textarea.addEventListener("scroll", () => {
		const scrollable = textarea.scrollHeight - textarea.clientHeight;
		if (scrollable <= 0) return;
		const ratio = textarea.scrollTop / scrollable;
		preview.scrollTop = ratio * (preview.scrollHeight - preview.clientHeight);
	});
}
