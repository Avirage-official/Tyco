import {
  IconBag,
  IconHome,
  IconMark,
  IconTag,
  IconTicket,
  IconUser,
  IconWave,
} from "@/components/icons";
import type { NavHiddenItems } from "@/lib/supabase/types";

// `section: "account"` items are always shown regardless of sign-in state
// (same as Account itself always was) — each of their pages already
// redirects to /login on its own, so there's no need to duplicate that
// check here just to decide whether to show the link.
export const navItems = [
  { href: "/", label: "Home", icon: IconHome, match: "exact" as const },
  { href: "/studio", label: "Happenings", icon: IconMark, match: "prefix" as const, navKey: "happenings" as const },
  { href: "/studio/deals", label: "Deals", icon: IconTag, match: "prefix" as const, navKey: "deals" as const },
  { href: "/journal", label: "Journal", icon: IconWave, match: "prefix" as const, navKey: "journal" as const },
  { href: "/shop", label: "Shop", icon: IconBag, match: "prefix" as const, navKey: "shop" as const },
  {
    href: "/account/tickets",
    label: "Your tickets",
    icon: IconTicket,
    match: "prefix" as const,
    section: "account" as const,
  },
  {
    href: "/account/orders",
    label: "Your orders",
    icon: IconBag,
    match: "prefix" as const,
    section: "account" as const,
  },
  {
    href: "/account/deals",
    label: "Your deals",
    icon: IconTag,
    match: "prefix" as const,
    section: "account" as const,
  },
  { href: "/account", label: "Account", icon: IconUser, match: "prefix" as const, section: "account" as const },
];

/** Drops any nav item whose navKey an admin has hidden (see /admin/settings). Items with no navKey (Home, Account, and the personal account links) are core utility and always shown. */
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

/**
 * Which single item should read as "active" for the current path. Needed
 * because /studio and /studio/deals are now siblings rather than one
 * nested under the other in the nav — a plain per-item prefix match would
 * mark Happenings active on /studio/deals too (it starts with "/studio/"),
 * so this picks the most specific (longest) matching href instead of
 * whichever item happens to come first.
 */
export function getActiveHref<T extends { href: string; match?: "exact" | "prefix" }>(
  items: T[],
  pathname: string
): string | undefined {
  return items
    .filter((item) => isActive(pathname, item.href, item.match ?? "prefix"))
    .sort((a, b) => b.href.length - a.href.length)[0]?.href;
}
