import { Link, useNavigation } from '@remix-run/react';
import {
	NavigationMenu,
	NavigationMenuItem,
	NavigationMenuLink,
	NavigationMenuList,
	navigationMenuTriggerStyle,
} from './ui/navigation-menu';
import { Sheet, SheetContent, SheetTrigger } from './ui/sheet';
import { IconMenu2 } from '@tabler/icons-react';
import { Button } from './ui/button';
import { useEffect, useState } from 'react';
import { cn } from '~/lib/utils';

function SheetContentForMobile() {
	// 実質的にスマホ専用なのっでForMobile
	return (
		<>
			<ul className="p-4">
				<li>
					<Button variant="outline" asChild className="w-full">
						<Link
							to="/blog"
							aria-label="ブログページへ移動する"
							prefetch="intent"
						>
							ブログ
						</Link>
					</Button>
				</li>
				<li className="mt-4">
					<Button variant="outline" asChild className="w-full">
						<Link
							to="/services"
							aria-label="サービス一覧へ移動する"
							prefetch="intent"
						>
							サービス
						</Link>
					</Button>
				</li>
				<li className="mt-4">
					<Button asChild className="w-full">
						<Link
							to="/tos"
							aria-label="利用規約ページへ移動する"
							prefetch="intent"
						>
							利用規約
						</Link>
					</Button>
				</li>
			</ul>
		</>
	);
}

interface NavbarProps {
	className?: string;
}

export function Navbar({ className }: NavbarProps) {
	const navigation = useNavigation();
	const [isOpenedSheet, setIsOpenedSheet] = useState<boolean>(false);

	useEffect(() => {
		if (navigation.state === 'loading') {
			setIsOpenedSheet(false);
		}
	}, [navigation.state]);

	return (
		<header
			className={cn(
				'border-b border-gray-200  bg-white top-0 sticky z-30',
				className,
			)}
		>
			<div
				className="m-auto header-wrapper flex justify-between items-center h-16"
				style={{ maxWidth: 'min(1200px, 90%)' }}
			>
				<NavigationMenu>
					<NavigationMenuList>
						<NavigationMenuItem className="text-2xl font-bold">
							<NavigationMenuLink
								className={navigationMenuTriggerStyle()}
								asChild
							>
								<Link
									to="/"
									aria-label="トップページへ移動する"
									prefetch="intent"
								>
									AkariNext
								</Link>
							</NavigationMenuLink>
						</NavigationMenuItem>
					</NavigationMenuList>
				</NavigationMenu>
				<NavigationMenu className="hidden sm:block">
					<NavigationMenuList>
						<NavigationMenuLink
							className={navigationMenuTriggerStyle()}
							asChild
						>
							<Link
								to="/blog"
								aria-label="ブログページへ移動する"
								prefetch="intent"
							>
								ブログ
							</Link>
						</NavigationMenuLink>
						<NavigationMenuLink
							className={navigationMenuTriggerStyle()}
							asChild
						>
							<Link
								to="/services"
								aria-label="サービス一覧へ移動する"
								prefetch="intent"
							>
								サービス
							</Link>
						</NavigationMenuLink>
					</NavigationMenuList>
				</NavigationMenu>
				<NavigationMenu className="sm:hidden">
					<NavigationMenuList>
						<NavigationMenuItem>
							<Sheet
								open={isOpenedSheet}
								onOpenChange={(isOpen) => setIsOpenedSheet(isOpen)}
							>
								<SheetTrigger asChild className="block">
									<Button
										variant={'ghost'}
										size="icon"
										className="flex justify-center"
										onClick={() => setIsOpenedSheet(true)}
									>
										<IconMenu2 className="" />
									</Button>
								</SheetTrigger>
								<SheetContent side="left">
									<SheetContentForMobile />
								</SheetContent>
							</Sheet>
						</NavigationMenuItem>
					</NavigationMenuList>
				</NavigationMenu>
			</div>
		</header>
	);
}
