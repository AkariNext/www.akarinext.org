export type SocialPlatform = "github" | "discord" | "steam" | "x";

export interface SocialLink {
	platform?: string;
	id?: string;
	url?: string;
}

export const SOCIAL_PROFILES = [
	{
		key: "github",
		label: "GitHub",
		placeholder: "octocat",
		help: "ユーザー名",
	},
	{
		key: "discord",
		label: "Discord",
		placeholder: "123456789012345678",
		help: "ユーザーID（数字）",
	},
	{
		key: "steam",
		label: "Steam",
		placeholder: "7656119… または custom-id",
		help: "SteamID64 またはカスタムID",
	},
	{
		key: "x",
		label: "X",
		placeholder: "username",
		help: "@を除いたユーザー名",
	},
] as const satisfies readonly {
	key: SocialPlatform;
	label: string;
	placeholder: string;
	help: string;
}[];

const aliases: Record<SocialPlatform, string[]> = {
	github: ["github"],
	discord: ["discord"],
	steam: ["steam"],
	x: ["x", "twitter", "x (twitter)"],
};

export function socialPlatformOf(platform?: string): SocialPlatform | null {
	const value = platform?.trim().toLowerCase();
	if (!value) return null;
	return (
		(Object.entries(aliases).find(([, values]) =>
			values.includes(value),
		)?.[0] as SocialPlatform | undefined) ?? null
	);
}

export function normalizeSocialId(
	platform: SocialPlatform,
	raw: string,
): string {
	let value = raw.trim();
	if (!value) return "";
	if (/^https?:\/\//i.test(value)) {
		throw new Error("URLではなくIDだけを入力してください。");
	}
	if (platform === "github" || platform === "x")
		value = value.replace(/^@/, "");

	if (
		platform === "github" &&
		!/^[a-z\d](?:[a-z\d]|-(?=[a-z\d])){0,38}$/i.test(value)
	) {
		throw new Error("GitHubのユーザー名が正しくありません。");
	}
	if (platform === "discord" && !/^\d{15,22}$/.test(value)) {
		throw new Error("DiscordのユーザーIDは15〜22桁の数字で入力してください。");
	}
	if (platform === "steam" && !/^[a-z\d_-]{2,64}$/i.test(value)) {
		throw new Error("Steam IDが正しくありません。");
	}
	if (platform === "x" && !/^[a-z\d_]{1,15}$/i.test(value)) {
		throw new Error("Xのユーザー名が正しくありません。");
	}
	return value;
}

export function socialUrl(platform: SocialPlatform, id: string): string {
	switch (platform) {
		case "github":
			return `https://github.com/${encodeURIComponent(id)}`;
		case "discord":
			return `https://discord.com/users/${encodeURIComponent(id)}`;
		case "steam":
			return /^\d{17}$/.test(id)
				? `https://steamcommunity.com/profiles/${id}`
				: `https://steamcommunity.com/id/${encodeURIComponent(id)}`;
		case "x":
			return `https://x.com/${encodeURIComponent(id)}`;
	}
}

/** 以前のURLだけのデータも、ダッシュボードのID入力へ戻せるようにする。 */
export function socialId(link: SocialLink): string {
	if (link.id) return link.id;
	const platform = socialPlatformOf(link.platform);
	if (!platform || !link.url) return "";
	try {
		const url = new URL(link.url);
		const parts = url.pathname.split("/").filter(Boolean);
		if (platform === "steam" && ["id", "profiles"].includes(parts[0])) {
			return decodeURIComponent(parts[1] ?? "");
		}
		return decodeURIComponent(parts[0] ?? "").replace(/^@/, "");
	} catch {
		return "";
	}
}

export function socialDisplayId(link: SocialLink): string {
	const id = socialId(link);
	return socialPlatformOf(link.platform) === "x" && id ? `@${id}` : id;
}

/** 古い自由入力データから危険なスキームを公開画面へ出さない。 */
export function safeSocialUrl(link: SocialLink): string | null {
	if (!link.url) return null;
	try {
		const url = new URL(link.url);
		return url.protocol === "https:" ? url.href : null;
	} catch {
		return null;
	}
}
