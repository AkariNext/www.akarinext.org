import {
	IconBadgeVr,
	IconBrandDiscord,
	IconBrandGithub,
	IconBrandSteam,
	IconWorld,
} from '@tabler/icons-react';
import { cn } from './utils';

export function getSocialIcon(type: string, props?: TablerIconsProps) {
	const className = cn('yx-social-icon', props?.className);
	switch (type) {
		case 'discord':
			return <IconBrandDiscord className={className} {...props} />;
		case 'github':
			return <IconBrandGithub className={className} {...props} />;
		case 'steam':
			return <IconBrandSteam className={className} {...props} />;
		case 'vrchat':
			return <IconBadgeVr className={className} {...props} />;
		default:
			return <IconWorld className={className} {...props} />;
	}
}
