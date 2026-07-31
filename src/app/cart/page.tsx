import type { Metadata } from "next";
import { PageHeader } from "@/components/ui/PageHeader";
import { createClient } from "@/lib/supabase/server";
import { CartPageContent } from "./CartPageContent";

export const metadata: Metadata = { title: "Cart" };

export default async function CartPage() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  return (
    <>
      <PageHeader eyebrow="Your bag" title="Cart" />
      <div className="container">
        <CartPageContent accountEmail={user?.email ?? null} />
      </div>
    </>
  );
}
