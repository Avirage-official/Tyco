import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { Accordion } from "@/components/ui/Accordion";
import { CoverImage } from "@/components/ui/CoverImage";
import { ParallaxMedia } from "@/components/ui/ParallaxMedia";
import { SectionHeader } from "@/components/ui/SectionHeader";
import { StickyBarSpacer } from "@/components/ui/StickyBar";
import { IconArrowRight, IconPin } from "@/components/icons";
import { createClient } from "@/lib/supabase/server";
import { getEventCatalog } from "@/lib/events/catalog";
import { formatEventDateLong, formatEventDateParts, formatEventDateTime } from "@/lib/format";
import { EventCardRow } from "../EventCardRow";
import { TicketPanel } from "./TicketPanel";
import styles from "./event.module.css";

type Params = { params: Promise<{ id: string }> };

export async function generateMetadata({ params }: Params): Promise<Metadata> {
  const { id } = await params;
  const supabase = await createClient();
  const { upcoming, past } = await getEventCatalog(supabase);
  const event = [...upcoming, ...past].find((e) => e.id === id);
  if (!event) return { title: "Event not found" };
  return {
    title: event.title,
    description:
      event.description ?? `${event.title} — ${formatEventDateTime(event.eventDate)} on Tyco.`,
    openGraph: event.coverUrl ? { images: [{ url: event.coverUrl }] } : undefined,
  };
}

function mapsHref(location: string) {
  return `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(location)}`;
}

export default async function EventPage({ params }: Params) {
  const { id } = await params;
  const supabase = await createClient();
  const [{ upcoming, past }, userData] = await Promise.all([
    getEventCatalog(supabase),
    supabase.auth.getUser(),
  ]);

  const event = [...upcoming, ...past].find((e) => e.id === id);
  if (!event) notFound();

  const isPast = !upcoming.some((e) => e.id === event.id);
  const moreDates = upcoming.filter((e) => e.id !== event.id).slice(0, 4);
  const signedIn = Boolean(userData.data.user);
  const { month, day } = formatEventDateParts(event.eventDate);
  const dateLine = formatEventDateLong(event.eventDate);

  return (
    <article className={`container ${styles.page}`}>
      <nav className={styles.breadcrumb} aria-label="Breadcrumb">
        <Link href="/happenings">Happenings</Link>
        <span aria-hidden>/</span>
        <span>
          {month} {day}
        </span>
      </nav>

      <ParallaxMedia className={styles.media}>
        <CoverImage
          src={event.coverUrl}
          alt={event.title}
          sizes="(min-width: 1180px) 1132px, 100vw"
          priority
        />
      </ParallaxMedia>

      <div className={styles.columns}>
        <div className={styles.main}>
          <header className={styles.header}>
            <p className={styles.date}>{dateLine}</p>
            <h1 className={styles.title}>{event.title}</h1>
            {event.location && (
              <p className={styles.meta}>
                <span>
                  <IconPin />
                  {event.location}
                </span>
              </p>
            )}
          </header>

          {isPast && (
            <p className={styles.passed} role="status">
              This event has already happened. See what&rsquo;s coming up on{" "}
              <Link href="/happenings" className={styles.inlineLink}>
                Happenings
              </Link>
              .
            </p>
          )}

          {event.description && (
            <section className={styles.section}>
              <h2 className={styles.sectionTitle}>About this event</h2>
              <p className={styles.prose}>{event.description}</p>
            </section>
          )}

          {event.organizer && (
            <section className={styles.section}>
              <h2 className={styles.sectionTitle}>Organiser</h2>
              <p className={styles.prose}>{event.organizer}</p>
            </section>
          )}

          {event.location && (
            <section className={styles.section}>
              <h2 className={styles.sectionTitle}>Venue</h2>
              <p className={styles.prose}>{event.location}</p>
              <a
                className={styles.mapLink}
                href={mapsHref(event.location)}
                target="_blank"
                rel="noopener noreferrer"
              >
                Open in Maps
                <IconArrowRight />
              </a>
            </section>
          )}

          {!isPast && (
            <section className={styles.section}>
              <Accordion title="Ticket terms">
                <p>
                  Tickets are final and non-refundable unless the organisers approve a refund. Your ticket is
                  tied to your Tyco account and checked at the door, so buy with the account you&rsquo;ll turn
                  up with. The full terms are in our{" "}
                  <Link href="/terms#tickets" className={styles.inlineLink}>
                    Terms &amp; Conditions
                  </Link>
                  .
                </p>
              </Accordion>
            </section>
          )}
        </div>

        {!isPast && (
          <aside className={styles.side}>
            <TicketPanel
              eventId={event.id}
              title={event.title}
              dateLine={dateLine}
              priceCents={event.priceCents}
              currency={event.currency}
              capacity={event.capacity}
              capacityRemaining={event.capacityRemaining}
              signedIn={signedIn}
            />
          </aside>
        )}
      </div>

      {moreDates.length > 0 && (
        <section className={styles.more}>
          <SectionHeader title="More dates" action={{ href: "/happenings", label: "See all" }} />
          <EventCardRow events={moreDates} />
        </section>
      )}

      {!isPast && <StickyBarSpacer />}
    </article>
  );
}
