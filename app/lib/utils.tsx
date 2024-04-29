import { type ClassValue, clsx } from 'clsx';
import {
	IconBrandDiscord,
	IconBrandGithub,
	IconBrandSteam,
	IconWorld,
	type IconProps,
} from '@tabler/icons-react';
import { twMerge } from 'tailwind-merge';
import { CSSProperties, ForwardRefExoticComponent, FunctionComponent, RefAttributes } from 'react';

// reference: https://github.com/tabler/tabler-icons/issues/1035#issuecomment-2059486846
export type TablerIconsProps = Partial<
  ForwardRefExoticComponent<Omit<IconProps, 'ref'> & RefAttributes<FunctionComponent<IconProps>>>
> & {
  className?: string;
  size?: string | number;
  stroke?: string | number;
  strokeWidth?: string | number;
  style?: CSSProperties;
};

export function cn(...inputs: ClassValue[]) {
	return twMerge(clsx(inputs));
}

export function getSocialIcon(type: string, props?: TablerIconsProps) {
	const className = cn('yx-social-icon', props?.className);
	switch (type) {
		case 'discord':
			return <IconBrandDiscord className={className} {...props} />;
		case 'github':
			return <IconBrandGithub className={className} {...props} />;
		case 'steam':
			return <IconBrandSteam className={className} {...props} />;
		default:
			return <IconWorld className={className} {...props} />;
	}
}

export function arrayBufferToBase64(buffer: ArrayBuffer) {
	let binary = '';
	const bytes = new Uint8Array(buffer);
	const len = bytes.byteLength;
	for (let i = 0; i < len; i++) {
		binary += String.fromCharCode(bytes[i]);
	}
	return btoa(binary);
}
