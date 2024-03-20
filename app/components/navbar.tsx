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

function SheetContentForMobile() {
	// 実質的にスマホ専用なのっでForMobile
	return (
		<>
			<ul className="p-4">
				<li>
					<Button variant="outline" asChild className="w-full">
						<Link to="/blog" aria-label="ブログページへ移動する">
							ブログ
						</Link>
					</Button>
				</li>
				<li className="mt-4">
					<Button variant="outline" asChild className="w-full">
						<Link to="/services" aria-label="サービス一覧へ移動する">
							サービス
						</Link>
					</Button>
				</li>
				<li className="mt-4">
					<Button asChild className="w-full">
						<Link to="/tos" aria-label="利用規約ページへ移動する">
							利用規約
						</Link>
					</Button>
				</li>
			</ul>
		</>
	);
}

export function Navbar() {
	const navigation = useNavigation();
	const [isOpenedSheet, setIsOpenedSheet] = useState<boolean>(false);

	useEffect(() => {
		if (navigation.state === 'loading') {
			setIsOpenedSheet(false);
		}
	}, [navigation.state]);

	return (
		<header className="flex h-16 justify-between items-center rounded-xl p-4 bg-white sticky top-0">
			<NavigationMenu>
				<NavigationMenuList>
					<NavigationMenuItem className="text-2xl font-bold">
						<NavigationMenuLink
							className={navigationMenuTriggerStyle()}
							asChild
						>
							<Link to="/" aria-label="トップページへ移動する">
								AkariNext
							</Link>
						</NavigationMenuLink>
					</NavigationMenuItem>
				</NavigationMenuList>
			</NavigationMenu>
			<NavigationMenu className="hidden sm:block">
				<NavigationMenuList>
					<NavigationMenuLink className={navigationMenuTriggerStyle()} asChild>
						<Link to="/blog" aria-label="ブログページへ移動する">
							ブログ
						</Link>
					</NavigationMenuLink>
					<NavigationMenuLink className={navigationMenuTriggerStyle()} asChild>
						<Link to="/services" aria-label="サービス一覧へ移動する">
							サービス
						</Link>
					</NavigationMenuLink>
				</NavigationMenuList>
			</NavigationMenu>
			<NavigationMenu>
				<NavigationMenuList>
					<NavigationMenuItem className="hidden sm:block">
						<NavigationMenuLink
							className={navigationMenuTriggerStyle()}
							asChild
							aria-label="利用規約ページへ移動する"
						>
							<Link to="/tos">利用規約</Link>
						</NavigationMenuLink>
					</NavigationMenuItem>
					<NavigationMenuItem>
						<Sheet
							open={isOpenedSheet}
							onOpenChange={(isOpen) => setIsOpenedSheet(isOpen)}
						>
							<SheetTrigger asChild className="block sm:hidden">
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
		</header>
	);
}
