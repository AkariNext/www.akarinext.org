import { cn } from "~/lib/utils";

export type AvatarProps = {
    src: string;
    alt: string;
    size?: "xs" | "sm" | "md" | "lg";
    rounded?: "full" | "md" | "sm" | "none";
}

export const avatarSizes = {
    xs: "w-8 h-8",
    sm: "w-12 h-12",
    md: "w-16 h-16",
    lg: "w-24 h-24"
}

export const avatarRoundeds = {
    full: "rounded-full",
    md: "rounded-md",
    sm: "rounded-sm",
    none: "rounded-none"
}

export function Avatar({src, alt, size, rounded}: AvatarProps) {

    const sizeClass = size ? avatarSizes[size] : avatarSizes.md
    const roundedClass = rounded ? avatarRoundeds[rounded] : avatarRoundeds.full

    return <img src={src} alt={alt} className={cn(sizeClass, roundedClass)} />
}