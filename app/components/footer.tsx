import { Link } from "@remix-run/react";
import { NavigationMenu, NavigationMenuItem, NavigationMenuLink, NavigationMenuList, navigationMenuTriggerStyle } from "./ui/navigation-menu";
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "./ui/tooltip";
import { TConfig } from "~/lib/config.server";
import { PickType } from "~/lib/helper.server";
import { getSocialIcon } from "~/lib/utils";

type Props = {
    links: PickType<PickType<TConfig, "footer">, "links">;
}

export function Footer({ links }: Props) {
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
                        {
                            links.map((link, index) => (
                                link.alt ? (
                                    <TooltipProvider key={index}>
                                        <Tooltip>
                                            <TooltipTrigger asChild>
                                                <NavigationMenuLink className={navigationMenuTriggerStyle()} asChild>
                                                    <a href={link.link} target="_blank" rel="noreferrer noopener" >{getSocialIcon(link.type)}</a>
                                                </NavigationMenuLink>
                                            </TooltipTrigger>
                                            <TooltipContent>
                                                <p>{link.alt}</p>
                                            </TooltipContent>
                                        </Tooltip>
                                    </TooltipProvider>
                                ) : (<>
                                    <NavigationMenuLink className={navigationMenuTriggerStyle()} asChild>
                                        <a href={link.link} target="_blank" rel="noreferrer noopener" >{getSocialIcon(link.type)}</a>
                                    </NavigationMenuLink>
                                </>)
                            ))
                        }
                    </NavigationMenuList>
                </NavigationMenu>
            </div>
            © 2024 AkariNext Allrights reserved.
        </footer>
    )
}