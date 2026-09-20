import type { NavHiddenItems } from "@/lib/supabase/types";

export type NavItem = {
  href: string;
  label: string;
  /** "prefix" (default) also matches child routes; "exact" matches only itself. */
  match?: "exact" | "prefix";
  /** Set when an admin can hide the section from the nav (see /admin/settings). */
  navKey?: keyof NavHiddenItems;
};

/**
 * The public sections, in nav order. Deals first: it is the product.
 */
export const primaryNav: NavItem[] = [
  { href: "/deals", label: "Deals", navKey: "deals" },
  { href: "/happenings", label: "Happenings", navKey: "happenings" },
  // navKey stays "journal": it is the stored key in
  // site_settings.nav_hidden_items, and renaming it would silently un-hide
  // the section for anyone who had hidden it.
  { href: "/listen", label: "Listen", navKey: "journal" },
  { href: "/shop", label: "Shop", navKey: "shop" },
  { href: "/about", label: "About", navKey: "about" },
];

/** The signed-in user's own pages. Each already redirects to /login on its own. */
export const accountNav: NavItem[] = [
  { href: "/account/deals", label: "Your deals" },
  { href: "/account/tickets", label: "Your tickets" },
  { href: "/account/orders", label: "Your orders" },
  { href: "/account", label: "Account", match: "exact" },
];

/** Drops any item whose section an admin has hidden. Items with no navKey are always shown. */
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
 * Which single item reads as "active" for the current path: the most
 * specific (longest) matching href, so /account/deals lights up "Your
 * deals" and not "Account" even though both prefixes match.
 */
export function getActiveHref<T extends { href: string; match?: "exact" | "prefix" }>(
  items: T[],
  pathname: string
): string | undefined {
  return items
    .filter((item) => isActive(pathname, item.href, item.match ?? "prefix"))
    .sort((a, b) => b.href.length - a.href.length)[0]?.href;
}
