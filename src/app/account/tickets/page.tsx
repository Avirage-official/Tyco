import type { Metadata } from "next";
import { redirect } from "next/navigation";
import { PageHeader } from "@/components/ui/PageHeader";
import { EmptyState } from "@/components/ui/EmptyState";
import { LinkButton } from "@/components/ui/Button";
import { createClient } from "@/lib/supabase/server";
import { TicketList } from "./TicketList";

export const metadata: Metadata = { title: "Your tickets" };

export default async function TicketsPage({
  searchParams,
}: {
  searchParams: Promise<{ ticket?: string }>;
}) {
  const { ticket: justPurchasedId } = await searchParams;
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    redirect("/login?next=/account/tickets");
  }

  // Same stale-pending sweep as deal redemptions — an abandoned checkout
  // more than 12 hours old is never coming back.
  await supabase.rpc("expire_stale_event_tickets");

  const { data: tickets } = await supabase
    .from("event_tickets")
    .select(
      "id, quantity, total_cents, currency, status, reference_code, checked_in_at, created_at, event_id"
    )
    .eq("user_id", user.id)
    .order("created_at", { ascending: false });

  const eventIds = Array.from(new Set((tickets ?? []).map((t) => t.event_id)));
  type EventRow = { id: string; title: string; location: string | null; event_date: string };
  let events: EventRow[] = [];
  if (eventIds.length > 0) {
    const { data } = await supabase
      .from("events")
      .select("id, title, location, event_date")
      .in("id", eventIds);
    events = data ?? [];
  }
  const eventById = new Map(events.map((e) => [e.id, e]));

  return (
    <>
      <PageHeader eyebrow="Your account" title="Your tickets" />
      <div className="container">
        {!tickets || tickets.length === 0 ? (
          <EmptyState
            title="No tickets yet"
            description="Tickets you buy for upcoming events show up here — this is what you show at the door."
            action={<LinkButton href="/studio">See what&rsquo;s on</LinkButton>}
          />
        ) : (
          <TicketList tickets={tickets} eventById={eventById} justPurchasedId={justPurchasedId} />
        )}
      </div>
    </>
  );
}
