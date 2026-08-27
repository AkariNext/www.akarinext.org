import type { APIRoute } from "astro";
import { buildMediaUrl } from "../../../lib/cms";
import {
	createRecord,
	DashboardError,
	getDashboardToken,
	isSameOriginRequest,
} from "../../../lib/dashboard.server";

export const prerender = false;

/** PocketBase 側の maxSize と揃える */
const MAX_BYTES = 8 * 1024 * 1024;
const ALLOWED = new Set([
	"image/jpeg",
	"image/png",
	"image/webp",
	"image/gif",
	"image/svg+xml",
]);

function json(body: unknown, status = 200): Response {
	return new Response(JSON.stringify(body), {
		status,
		headers: {
			"Content-Type": "application/json",
			"Cache-Control": "no-store",
		},
	});
}

/**
 * 本文に貼り付けた画像を受け取り、media コレクションに保存して URL を返す。
 * 記事レコードとは独立しているので、まだ保存していない新規記事からでも使える。
 */
export const POST: APIRoute = async ({ request, cookies, locals, site }) => {
	if (!locals.user) return json({ error: "ログインしてください。" }, 401);
	if (!isSameOriginRequest(request, site)) {
		return json({ error: "不正なリクエストです。" }, 403);
	}

	let file: File;
	let alt = "";
	try {
		const form = await request.formData();
		const candidate = form.get("file");
		if (!(candidate instanceof File)) {
			return json({ error: "画像が含まれていません。" }, 400);
		}
		file = candidate;
		alt = String(form.get("alt") ?? "").slice(0, 300);
	} catch {
		return json({ error: "画像を読み取れませんでした。" }, 400);
	}

	if (!ALLOWED.has(file.type)) {
		return json({ error: "対応していない画像形式です。" }, 415);
	}
	if (file.size > MAX_BYTES) {
		return json({ error: "画像は 8 MB までです。" }, 413);
	}

	try {
		const token = getDashboardToken(cookies);
		const body = new FormData();
		body.set("file", file);
		body.set("uploader", locals.user.id);
		if (alt) body.set("alt", alt);

		const record = await createRecord(token, "media", body);
		const filename = typeof record.file === "string" ? record.file : "";
		if (!filename) return json({ error: "保存に失敗しました。" }, 500);

		return json({
			id: record.id,
			url: buildMediaUrl("media", record.id, filename),
			alt,
		});
	} catch (error) {
		if (error instanceof DashboardError) {
			return json({ error: error.message }, error.status);
		}
		console.error("[media] upload failed", error);
		return json({ error: "保存に失敗しました。" }, 500);
	}
};
