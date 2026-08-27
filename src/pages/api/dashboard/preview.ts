import type { APIRoute } from "astro";
import { markdownToHtml } from "../../../lib/richtext";

export const prerender = false;

/** 本文の上限。プレビューは入力のたびに走るので、極端に長い入力は弾く */
const MAX_LENGTH = 200_000;

/**
 * エディタのライブプレビュー。
 *
 * 変換は公開ページとまったく同じ markdownToHtml を通す。
 * ブラウザ側で別の Markdown 実装を使うと、リンクカードや YouTube 埋め込みの
 * 扱いがズレて「実際の見え方」を確認できなくなるため。
 */
export const POST: APIRoute = async ({ request, locals }) => {
	if (!locals.user) {
		return new Response(JSON.stringify({ error: "unauthorized" }), {
			status: 401,
			headers: { "Content-Type": "application/json" },
		});
	}

	let content = "";
	try {
		const body = (await request.json()) as { content?: unknown };
		content = typeof body.content === "string" ? body.content : "";
	} catch {
		return new Response(JSON.stringify({ error: "invalid json" }), {
			status: 400,
			headers: { "Content-Type": "application/json" },
		});
	}

	if (content.length > MAX_LENGTH) {
		return new Response(JSON.stringify({ error: "too long" }), {
			status: 413,
			headers: { "Content-Type": "application/json" },
		});
	}

	try {
		const html = await markdownToHtml(content);
		return new Response(JSON.stringify({ html }), {
			headers: {
				"Content-Type": "application/json",
				"Cache-Control": "no-store",
			},
		});
	} catch (error) {
		console.error("[preview] Failed to render markdown", error);
		return new Response(JSON.stringify({ error: "render failed" }), {
			status: 500,
			headers: { "Content-Type": "application/json" },
		});
	}
};
