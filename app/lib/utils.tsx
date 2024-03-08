import { type ClassValue, clsx } from "clsx"
import { IconBrandDiscord, IconBrandGithub, IconBrandSteam, IconWorld } from "@tabler/icons-react";
import { twMerge } from "tailwind-merge"

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}



export function getSocialIcon(type: string) {
    switch (type) {
      case "discord":
        return <IconBrandDiscord />;
      case "github":
        return <IconBrandGithub />;
      case "steam":
        return <IconBrandSteam />;
      default:
        return <IconWorld />;
    }
  }
