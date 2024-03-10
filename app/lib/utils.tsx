import { type ClassValue, clsx } from "clsx"
import { IconBrandDiscord, IconBrandGithub, IconBrandSteam, IconWorld, TablerIconsProps } from "@tabler/icons-react";
import { twMerge } from "tailwind-merge"

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}



export function getSocialIcon(type: string, props?: TablerIconsProps) {
  let className = cn("yx-social-icon", props?.className);
  switch (type) {
    case "discord":
      return <IconBrandDiscord className={className} {...props}  />;
    case "github":
      return <IconBrandGithub className={className} {...props}/>;
    case "steam":
      return <IconBrandSteam className={className} {...props} />;
    default:
      return <IconWorld className={className} {...props} />;
  }
}
