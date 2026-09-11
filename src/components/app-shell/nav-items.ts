import {
  IconBag,
  IconHome,
  IconMark,
  IconUser,
  IconWave,
} from "@/components/icons";
import type { NavHiddenItems } from "@/lib/supabase/types";

export const navItems = [
  { href: "/", label: "Home", icon: IconHome, match: "exact" as const },
  { href: "/studio", label: "Happenings", icon: IconMark, match: "prefix" as const, navKey: "happenings" as const },
  { href: "/journal", label: "Journal", icon: IconWave, match: "prefix" as const, navKey: "journal" as const },
  { href: "/shop", label: "Shop", icon: IconBag, match: "prefix" as const, navKey: "shop" as const },
  { href: "/account", label: "Account", icon: IconUser, match: "prefix" as const },
];

/** Drops any nav item whose navKey an admin has hidden (see /admin/settings). Items with no navKey (Home, Account) are core utility and always shown. */
export function visibleNavItems<T extends { navKey?: keyof NavHiddenItems }>(
  items: T[],
  hidden: NavHiddenItems
): T[] {
  return items.filter((item) => !item.navKey || !hidden[item.navKey]);
}

export function isActive(pathname: string, href: string, match: "exact" | "prefix") {
  if (match === "exact") return pathname === href;
  return pathname === href || pathname.startsWith(`${href}/`);
}
