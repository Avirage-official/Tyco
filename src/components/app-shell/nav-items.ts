import {
  IconBag,
  IconHome,
  IconMark,
  IconStar,
  IconUser,
} from "@/components/icons";

export const navItems = [
  { href: "/", label: "Home", icon: IconHome, match: "exact" as const },
  { href: "/creators", label: "Creators", icon: IconStar, match: "prefix" as const },
  { href: "/studio", label: "Studio", icon: IconMark, match: "prefix" as const },
  { href: "/shop", label: "Shop", icon: IconBag, match: "prefix" as const },
  { href: "/account", label: "Account", icon: IconUser, match: "prefix" as const },
];

export function isActive(pathname: string, href: string, match: "exact" | "prefix") {
  if (match === "exact") return pathname === href;
  return pathname === href || pathname.startsWith(`${href}/`);
}
