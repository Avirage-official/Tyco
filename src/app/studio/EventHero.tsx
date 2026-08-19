import { formatEventDateParts } from "@/lib/format";
import { TicketPurchase } from "./TicketPurchase";
import styles from "./EventHero.module.css";

type HeroEvent = {
  id: string;
  title: string;
  location: string | null;
  organizer: string | null;
  event_date: string;
  cover_url: string | null;
  cover_video_url: string | null;
  price_cents: number;
  currency: string;
  capacity: number | null;
  capacity_remaining: number | null;
};

export function EventHero({ event, signedIn }: { event: HeroEvent; signedIn: boolean }) {
  const { month, day, weekday, time } = formatEventDateParts(event.event_date);

  return (
    <section className={styles.hero}>
      {event.cover_video_url ? (
        <video className={styles.media} autoPlay muted loop playsInline aria-hidden>
          <source src={event.cover_video_url} type="video/mp4" />
        </video>
      ) : (
        <span
          className={styles.media}
          style={event.cover_url ? { backgroundImage: `url(${event.cover_url})` } : undefined}
          aria-hidden
        />
      )}
      <span className={styles.scrim} aria-hidden />

      <div className={`container ${styles.inner}`}>
        <p className={styles.eyebrow}>Next up</p>
        <div className={styles.dateRow}>
          <span className={styles.dateBig}>
            {month} {day}
          </span>
          <span className={styles.dateDetail}>
            {weekday} · {time}
          </span>
        </div>
        <h1 className={styles.title}>{event.title}</h1>
        {(event.location || event.organizer) && (
          <div className={styles.metaRow}>
            {event.location && <span>{event.location}</span>}
            {event.organizer && <span>Hosted by {event.organizer}</span>}
          </div>
        )}
        <div className={styles.action}>
          <TicketPurchase
            eventId={event.id}
            priceCents={event.price_cents}
            currency={event.currency}
            capacityRemaining={event.capacity != null ? event.capacity_remaining : null}
            signedIn={signedIn}
          />
        </div>
      </div>
    </section>
  );
}
