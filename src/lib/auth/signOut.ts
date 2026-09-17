"use client";

import { createClient } from "@/lib/supabase/client";
import { clearStoredCart } from "@/lib/cart/CartContext";

/**
 * Ends the Supabase session and clears the device-local cart. Callers
 * navigate afterwards (usually `router.push("/")` + `router.refresh()`)
 * so server components re-render in the signed-out state.
 */
export async function signOut() {
  const supabase = createClient();
  await supabase.auth.signOut();
  clearStoredCart();
}
