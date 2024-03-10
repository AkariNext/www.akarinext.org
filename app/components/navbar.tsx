import { Link } from "@remix-run/react";
import { NavigationMenu, NavigationMenuItem, NavigationMenuLink, NavigationMenuList, navigationMenuTriggerStyle } from "./ui/navigation-menu";

export function Navbar() {
    return (
        <header className="flex h-16 justify-between items-center rounded-xl p-4 bg-white sticky top-0">
            <NavigationMenu>
                <NavigationMenuList>
                    <NavigationMenuItem className="text-2xl font-bold">
                        <NavigationMenuLink className={navigationMenuTriggerStyle()} asChild>
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
            <NavigationMenu className="hidden sm:block">
                <NavigationMenuList>
                    <NavigationMenuItem>
                        <NavigationMenuLink className={navigationMenuTriggerStyle()} asChild aria-label="利用規約ページへ移動する">
                            <Link to="/tos">
                                利用規約
                            </Link>
                        </NavigationMenuLink>
                    </NavigationMenuItem>
                </NavigationMenuList>
            </NavigationMenu>
        </header>
    )
}
