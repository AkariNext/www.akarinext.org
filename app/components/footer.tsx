import { Link } from '@remix-run/react';
import {
	NavigationMenu,
	NavigationMenuItem,
	NavigationMenuLink,
	NavigationMenuList,
	navigationMenuTriggerStyle,
} from './ui/navigation-menu';
import type { TConfig } from '~/lib/config.server';
import type { PickType } from '~/lib/helper.server';
import { getSocialIcon } from '~/lib/utils';
import EasyTooltip from './Tooltip';

type Props = {
	links: PickType<PickType<TConfig, 'footer'>, 'links'>;
};

export function Footer({ links }: Props) {
	return (
		<footer className="mt-16 bg-white p-4">
			<div className="sm:flex block min-h-16  items-center sticky mb-4">
				<NavigationMenu>
					<NavigationMenuList>
						<NavigationMenuItem className="text-2xl font-bold">
							<NavigationMenuLink
								className={navigationMenuTriggerStyle()}
								asChild
							>
								<Link to="/" aria-label="トップページに移動する">
									AkariNext
								</Link>
							</NavigationMenuLink>
						</NavigationMenuItem>
					</NavigationMenuList>
				</NavigationMenu>
				<NavigationMenu>
					<NavigationMenuList>
						{links.map((link, index) =>
							link.alt ? (
								<EasyTooltip key={index} tooltip={link.alt}>
									<NavigationMenuLink
										className={navigationMenuTriggerStyle()}
										asChild
									>
										<a
											href={link.link}
											target="_blank"
											rel="noreferrer noopener"
											aria-label={`${link.type} へ移動する`}
										>
											{getSocialIcon(link.type)}
										</a>
									</NavigationMenuLink>
								</EasyTooltip>
							) : (
								<NavigationMenuLink
									key={index}
									className={navigationMenuTriggerStyle()}
									asChild
								>
									<a
										href={link.link}
										target="_blank"
										rel="noreferrer noopener"
										aria-label={`${link.type} へ移動する`}
									>
										{getSocialIcon(link.type)}
									</a>
								</NavigationMenuLink>
							),
						)}
					</NavigationMenuList>
				</NavigationMenu>
			</div>
			<div className="mt-4 px-3">&copy; 2024 AkariNext</div>
		</footer>
	);
}
