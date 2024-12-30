export type Member = {
	name: string;
	avatar: string;
	roles: string[];
	socials: { type: string; url: string }[];
};

export const MEMBERS = [
	{
		name: 'yupix',
		avatar: '/img/avatars/yupix.webp',
		roles: ['mod', 'dev', 'designer'],
		socials: [
			{ type: 'github', url: 'https://github.com/yupix' },
			{ type: 'discord', url: 'https://discord.com/users/315809057032110103' },
			{ type: 'steam', url: 'https://steamcommunity.com/id/pirolin009/' },
			{
				type: 'vrchat',
				url: 'https://vrchat.com/home/user/usr_a01aa0ee-9aa9-44d2-af17-68d1d992997f',
			},
			{ type: 'web', url: 'https://nr.akarinext.org/@yupix' },
		],
	},
	{
		name: 'aki',
		avatar: '/img/avatars/aki.webp',
		roles: ['mod', 'dev'],
		socials: [
			{ type: 'github', url: 'https://github.com/sousuke0422' },
			{ type: 'discord', url: 'https://discord.com/users/499157410380906517' },
			{ type: 'steam', url: 'https://steamcommunity.com/id/S6Z' },
			{ type: 'web', url: 'https://kr.akirin.xyz/@aki' },
		],
	},
	{
		name: 'Alumis',
		avatar: '/img/avatars/alumis.webp',
		roles: ['mod'],
		socials: [
			{ type: 'steam', url: 'https://steamcommunity.com/id/_Alumis_' },
			{ type: 'web', url: 'https://nr.akarinext.org/@alumis' },
		],
	},
	{
		name: 'ikaros',
		avatar: '/img/avatars/ikaros.webp',
		roles: ['mod'],
		socials: [
			{
				type: 'steam',
				url: 'https://steamcommunity.com/profiles/76561198831843914',
			},
		],
	},
] as const satisfies Member[];
