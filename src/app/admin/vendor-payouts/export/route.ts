import { NextResponse } from "next/server";
import { requireAdmin } from "@/lib/admin/require-admin";
import { monthBounds, resolveMonth } from "../month";

function csvEscape(value: string) {
  return /[",\n]/.test(value) ? `"${value.replace(/"/g, '""')}"` : value;
}

export async function GET(request: Request) {
  const { supabase } = await requireAdmin();
  const { searchParams } = new URL(request.url);
  const month = resolveMonth(searchParams.get("month"));
  const { start, end } = monthBounds(month);

  const { data: redemptions } = await supabase
    .from("deal_redemptions")
    .select("id, deal_id, vendor_id, vendor_rate_cents, currency, redeemed_location, approved_at, reference_code")
    .not("approved_at", "is", null)
    .gte("approved_at", start)
    .lt("approved_at", end)
    .order("approved_at", { ascending: true });

  const dealIds = Array.from(new Set((redemptions ?? []).map((r) => r.deal_id)));
  const vendorIds = Array.from(new Set((redemptions ?? []).map((r) => r.vendor_id)));

  const [{ data: deals }, { data: vendors }] = await Promise.all([
    dealIds.length > 0
      ? supabase.from("deals").select("id, title").in("id", dealIds)
      : Promise.resolve({ data: [] as { id: string; title: string }[] }),
    vendorIds.length > 0
      ? supabase.from("vendors").select("id, name").in("id", vendorIds)
      : Promise.resolve({ data: [] as { id: string; name: string }[] }),
  ]);

  const dealTitle = new Map((deals ?? []).map((d) => [d.id, d.title]));
  const vendorNameById = new Map((vendors ?? []).map((v) => [v.id, v.name]));

  const header = "Vendor,Deal,Reference,Location,Approved at,Owed,Currency\n";
  const rows = (redemptions ?? [])
    .map((r) =>
      [
        csvEscape(vendorNameById.get(r.vendor_id) ?? ""),
        csvEscape(dealTitle.get(r.deal_id) ?? ""),
        r.reference_code,
        csvEscape(r.redeemed_location ?? ""),
        r.approved_at ?? "",
        (r.vendor_rate_cents / 100).toFixed(2),
        r.currency,
      ].join(",")
    )
    .join("\n");

  return new NextResponse(header + rows + (rows ? "\n" : ""), {
    headers: {
      "Content-Type": "text/csv; charset=utf-8",
      "Content-Disposition": `attachment; filename="vendor-payouts-${month}.csv"`,
    },
  });
}
