import { Link } from "@remix-run/react";
import { NavigationMenu, NavigationMenuItem, NavigationMenuLink, NavigationMenuList, navigationMenuTriggerStyle } from "./ui/navigation-menu";
import { IconBrandDiscord } from "@tabler/icons-react";
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "./ui/tooltip";


export function Footer() {
    return (
        <footer className="mb-4">
            <div className="flex h-16 items-center rounded-xl p-4 bg-white sticky top-0 mb-4">
                <NavigationMenu>
                    <NavigationMenuList>
                        <NavigationMenuItem className="text-2xl font-bold">
                            <NavigationMenuLink className={navigationMenuTriggerStyle()} asChild>
                                <Link to="/">
                                    AkariNext
                                </Link>
                            </NavigationMenuLink>
                        </NavigationMenuItem>
                    </NavigationMenuList>
                </NavigationMenu>
                <NavigationMenu className="hidden sm:block">
                    <NavigationMenuList>
                        <TooltipProvider>
                            <Tooltip>
                                <TooltipTrigger asChild>
                                    <NavigationMenuLink className={navigationMenuTriggerStyle()} asChild>
                                        <a href="https://discord.gg/E2aG9qrFmh" target="_blank" rel="noreferrer noopener" ><IconBrandDiscord /></a>
                                    </NavigationMenuLink>
                                </TooltipTrigger>
                                <TooltipContent>
                                    <p>公式Discord</p>
                                </TooltipContent>
                            </Tooltip>
                        </TooltipProvider>
                    </NavigationMenuList>
                </NavigationMenu>
            </div>
            © 2024 AkariNext Allrights reserved.
        </footer>
    )
}