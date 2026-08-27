import type { APIRoute } from "astro";
import {
	DashboardError,
	deleteRecord,
	getDashboardToken,
	getOwnPost,
	isSameOriginRequest,
	updateRecord,
} from "../../../../lib/dashboard.server";

export const prerender = false;

const CATEGORIES = new Set(["tech", "game", "misc"]);
const STATUSES = new Set(["draft", "published"]);
const IMAGE_TYPES = new Set([
	"image/jpeg",
	"image/png",
	"image/webp",
	"image/gif",
]);

function text(form: FormData, key: string): string {
	const value = form.get(key);
	return typeof value === "string" ? value.trim() : "";
}

function updatePostBody(input: FormData): FormData {
	const title = text(input, "title");
	const content = text(input, "content");
	const slug = text(input, "slug").toLowerCase();
	const category = text(input, "category");
	const status = text(input, "status");
	if (!title || title.length > 160)
		throw new DashboardError("タイトルは160文字以内で入力してください。", 400);
	if (content.length > 200_000)
		throw new DashboardError("本文が長すぎます。", 400);
	if (slug && !/^[a-z0-9]+(?:-[a-z0-9]+)*$/.test(slug))
		throw new DashboardError(
			"URL名は半角英数字とハイフンで入力してください。",
			400,
		);
	if (!CATEGORIES.has(category) || !STATUSES.has(status))
		throw new DashboardError(
			"カテゴリーまたは公開状態が正しくありません。",
			400,
		);

	const body = new FormData();
	body.set("title", title);
	body.set("content", content);
	body.set("slug", slug);
	body.set("category", category);
	body.set("status", status);
	body.set("is_spoiler", input.has("is_spoiler") ? "true" : "false");
	body.set("spoiler_warning", text(input, "spoiler_warning").slice(0, 300));
	body.set(
		"tags",
		JSON.stringify(
			input
				.getAll("tags")
				.filter((value): value is string => typeof value === "string"),
		),
	);
	body.set("series", text(input, "series"));
	const seriesOrder = text(input, "series_order");
	body.set(
		"series_order",
		seriesOrder
			? String(Math.max(0, Number.parseInt(seriesOrder, 10) || 0))
			: "0",
	);
	const published = text(input, "published_date");
	if (published) body.set("published_date", new Date(published).toISOString());
	else if (status === "published")
		body.set("published_date", new Date().toISOString());
	else body.set("published_date", "");

	if (input.has("remove_image")) body.set("image", "");
	const image = input.get("image");
	if (image instanceof File && image.size > 0) {
		if (image.size > 8 * 1024 * 1024 || !IMAGE_TYPES.has(image.type))
			throw new DashboardError(
				"画像は JPEG・PNG・WebP・GIF の8MB以内にしてください。",
				400,
			);
		body.set("image", image, image.name);
	}
	return body;
}

export const POST: APIRoute = async ({
	request,
	cookies,
	locals,
	params,
	redirect,
	site,
}) => {
	const id = params.id ?? "";
	if (!locals.user)
		return redirect(`/auth/login?next=/dashboard/posts/${id}`, 302);
	if (!isSameOriginRequest(request, site))
		return new Response("Forbidden", { status: 403 });
	try {
		const token = getDashboardToken(cookies);
		const post = await getOwnPost(token, locals.user.id, id);
		const input = await request.formData();
		if (text(input, "_action") === "delete") {
			if (text(input, "confirm_title") !== post.title)
				throw new DashboardError("削除確認のタイトルが一致しません。", 400);
			await deleteRecord(token, "posts", id);
			return redirect("/dashboard?notice=post-deleted", 303);
		}
		await updateRecord(token, "posts", id, updatePostBody(input));
		return redirect(`/dashboard/posts/${id}?notice=saved`, 303);
	} catch (error) {
		const message =
			error instanceof DashboardError
				? error.message
				: "記事を保存できませんでした。";
		return redirect(
			`/dashboard/posts/${id}?error=${encodeURIComponent(message)}`,
			303,
		);
	}
};
