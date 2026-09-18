import type { Metadata } from "next";
import { EmptyState } from "@/components/ui/EmptyState";
import { PageHeader } from "@/components/ui/PageHeader";
import { SectionHeader } from "@/components/ui/SectionHeader";
import { createClient } from "@/lib/supabase/server";
import { getEventCatalog, groupUpcoming } from "@/lib/events/catalog";
import { EventCardRow } from "./EventCardRow";
import { EventList } from "./EventList";
import { FeaturedEvent } from "./FeaturedEvent";
import styles from "./happenings.module.css";

const DESCRIPTION = "Shows, sessions and parties run by Tyco and the people we work with.";

export const metadata: Metadata = {
  title: "Happenings",
  description: DESCRIPTION,
};

/** Past events are shown as a record of what's been, not an archive to browse. */
const PAST_LIMIT = 8;

export default async function HappeningsPage() {
  const supabase = await createClient();
  const { upcoming, past } = await getEventCatalog(supabase);

  const [featured, ...rest] = upcoming;
  const groups = groupUpcoming(rest);

  return (
    <>
      <PageHeader title="Happenings" description={DESCRIPTION} wide />

      {featured && <FeaturedEvent event={featured} />}

      <div className={`container container--wide ${styles.body}`}>
        {!featured && (
          <EmptyState
            title="No dates on the calendar yet"
            description="Upcoming shows and sessions will be listed here as they're announced."
          />
        )}

        {groups.map((group) => (
          <section key={group.id}>
            <SectionHeader title={group.label} />
            <EventList events={group.events} />
          </section>
        ))}

        {past.length > 0 && (
          <section>
            <SectionHeader title="Past events" description="What we've already run." />
            <EventCardRow events={past.slice(0, PAST_LIMIT)} muted />
          </section>
        )}
      </div>
    </>
  );
}
