"use client";

import { usePathname } from "next/navigation";
import type { NavHiddenItems } from "@/lib/supabase/types";
import { Footer } from "./Footer";

/**
 * Routes that are a single task rather than a page: sitewide links below
 * them are an invitation to abandon what the screen is asking for, which is
 * why Airbnb, Stripe and Typeform all strip the chrome off a flow like
 * this. The header stays — leaving is allowed, wandering is not encouraged.
 */
const BARE_ROUTES = ["/welcome"];

export function FooterSlot({ hiddenItems }: { hiddenItems: NavHiddenItems }) {
  const pathname = usePathname();
  if (BARE_ROUTES.some((route) => pathname === route || pathname.startsWith(`${route}/`))) {
    return null;
  }
  return <Footer hiddenItems={hiddenItems} />;
}
