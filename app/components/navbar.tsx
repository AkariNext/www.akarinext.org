import { Form, Link, useNavigation, useSubmit } from '@remix-run/react';
import {
	NavigationMenu,
	NavigationMenuItem,
	NavigationMenuLink,
	NavigationMenuList,
	navigationMenuTriggerStyle,
} from './ui/navigation-menu';
import { Sheet, SheetContent, SheetTrigger } from './ui/sheet';
import { IconMenu2, IconPencil, IconUser } from '@tabler/icons-react';
import { Button } from './ui/button';
import { useEffect, useState } from 'react';
import { cn } from '~/lib/utils';
import { Avatar } from './Avatar';
import { User } from '~/lib/auth.server';
import {
	DropdownMenu,
	DropdownMenuContent,
	DropdownMenuItem,
	DropdownMenuLabel,
	DropdownMenuSeparator,
	DropdownMenuTrigger,
} from '~/components/ui/dropdown-menu';

function SheetContentForMobile() {
	// 実質的にスマホ専用なのっでForMobile
	return (
		<>
			<ul className="p-4">
				<li>
					<Button variant="outline" asChild className="w-full">
						<Link
							to="/articles/"
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
	user?: User;
}

export function Navbar({ className, user }: NavbarProps) {
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
								to="/articles/"
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
						{user ? (
							<>
								<NavigationMenuItem asChild>
									<DropdownMenu>
										<DropdownMenuTrigger>
											<Avatar src={user.avatarUrl} alt="" size="sm" />
										</DropdownMenuTrigger>
										<DropdownMenuContent>
											<DropdownMenuLabel>My Account</DropdownMenuLabel>
											<DropdownMenuSeparator />
											<DropdownMenuItem>
												<Link to={`/${user.name}`}>
													<IconUser /> プロフィール
												</Link>
											</DropdownMenuItem>
											<DropdownMenuItem>
												{/*<Link to="/dashboard">*/}
													<IconPencil />
													記事の管理
												{/*</Link>*/}
											</DropdownMenuItem>
										</DropdownMenuContent>
									</DropdownMenu>
								</NavigationMenuItem>
								<NavigationMenuItem asChild>
									<Form action="/article/new" method="POST">
										<Button type="submit">新規作成</Button>
									</Form>
								</NavigationMenuItem>
							</>
						) : (
							<NavigationMenuLink asChild>
								<Link
									to="/login"
									aria-label="ログインページへ移動する"
									prefetch="intent"
								>
									ログイン
								</Link>
							</NavigationMenuLink>
						)}
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
