import type { Metadata } from "next";
import Link from "next/link";
import { redirect } from "next/navigation";
import { PageHeader } from "@/components/ui/PageHeader";
import { createClient } from "@/lib/supabase/server";
import { getDealCatalog } from "@/lib/deals/catalog";
import { getEventCatalog } from "@/lib/events/catalog";
import { DealCard } from "@/app/deals/DealCard";
import { EventCard } from "@/app/happenings/EventCard";
import { IconArrowRight, IconShield } from "@/components/icons";
import { SettingsPanel } from "./SettingsPanel";
import styles from "./account.module.css";

export const metadata: Metadata = { title: "Account" };

/**
 * One of each. Four posters stacked in a column run far taller than the
 * settings beside them and stop being a suggestion — this is a sidebar,
 * not a second listing page.
 */
const RAIL_LIMIT = 1;

export default async function AccountPage() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) redirect("/login?next=%2Faccount");

  const [{ data: profile }, { data: isAdmin }, { count: ticketsReady }, { count: dealsReady }] =
    await Promise.all([
      supabase
        .from("profiles")
        .select("display_name, date_of_birth, country")
        .eq("id", user.id)
        .maybeSingle(),
      supabase.rpc("is_admin"),
      // Paid and not yet handed over: the two numbers a member actually
      // wants from this page, which a link to a list cannot give them.
      supabase
        .from("event_tickets")
        .select("id", { count: "exact", head: true })
        .eq("user_id", user.id)
        .eq("status", "paid")
        .is("checked_in_at", null)
        .is("denied_at", null),
      supabase
        .from("deal_redemptions")
        .select("id", { count: "exact", head: true })
        .eq("user_id", user.id)
        .eq("status", "paid")
        .is("approved_at", null)
        .is("declined_at", null),
    ]);

  const [{ upcoming }, { deals }] = await Promise.all([
    getEventCatalog(supabase),
    getDealCatalog(supabase),
  ]);

  // Only the providers on the account decide whether a password exists —
  // a Google-only account has none to change.
  const identities = user.identities ?? [];
  const usesPassword = identities.some((i) => i.provider === "email") || identities.length === 0;
  const provider = identities.find((i) => i.provider !== "email")?.provider ?? "email";

  const counts = [
    ticketsReady
      ? {
          href: "/account/tickets",
          text: `${ticketsReady} ticket${ticketsReady === 1 ? "" : "s"} ready`,
        }
      : null,
    dealsReady
      ? {
          href: "/account/deals",
          text: `${dealsReady} deal${dealsReady === 1 ? "" : "s"} to redeem`,
        }
      : null,
  ].filter(Boolean) as { href: string; text: string }[];

  const railEvents = upcoming.slice(0, RAIL_LIMIT);
  const railDeals = deals.slice(0, RAIL_LIMIT);

  return (
    <>
      <PageHeader title="Account" />

      <div className={`container ${styles.wrap}`}>
        {counts.length > 0 && (
          <div className={styles.counts}>
            {counts.map((count) => (
              <Link key={count.href} href={count.href} className={styles.count}>
                {count.text}
                <IconArrowRight aria-hidden />
              </Link>
            ))}
          </div>
        )}

        <div className={styles.columns}>
          <SettingsPanel
            displayName={profile?.display_name ?? null}
            dateOfBirth={profile?.date_of_birth ?? null}
            country={profile?.country ?? null}
            email={user.email ?? ""}
            usesPassword={usesPassword}
            provider={provider}
          />

          <aside className={styles.rail}>
            {railEvents.length > 0 && (
              <section className={styles.railSection}>
                <div className={styles.railHead}>
                  <h2 className={styles.railTitle}>Happening soon</h2>
                  <Link href="/happenings" className={styles.railMore}>
                    See all
                  </Link>
                </div>
                <div className={styles.railCards}>
                  {railEvents.map((event) => (
                    <EventCard key={event.id} event={event} />
                  ))}
                </div>
              </section>
            )}

            {railDeals.length > 0 && (
              <section className={styles.railSection}>
                <div className={styles.railHead}>
                  <h2 className={styles.railTitle}>Deals for you</h2>
                  <Link href="/deals" className={styles.railMore}>
                    See all
                  </Link>
                </div>
                <div className={styles.railCards}>
                  {railDeals.map((deal) => (
                    <DealCard key={deal.id} deal={deal} />
                  ))}
                </div>
              </section>
            )}

            {isAdmin && (
              <Link href="/admin" className={styles.adminLink}>
                <IconShield aria-hidden />
                Admin
              </Link>
            )}
          </aside>
        </div>
      </div>
    </>
  );
}
