import { formatEventDateParts, formatPrice } from "@/lib/format";
import { TicketPurchase } from "./TicketPurchase";
import styles from "./EventHero.module.css";

type HeroEvent = {
  id: string;
  title: string;
  description: string | null;
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
  const going =
    event.capacity != null && event.capacity_remaining != null
      ? event.capacity - event.capacity_remaining
      : null;

  const metaParts = [
    event.location,
    event.organizer && `Hosted by ${event.organizer}`,
    event.capacity != null && `${event.capacity_remaining} seats left`,
  ].filter(Boolean) as string[];

  return (
    <section className={styles.hero}>
      <p className={styles.eyebrow}>Next up</p>

      <div className={styles.heroImage}>
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
      </div>

      <div className={styles.body}>
        <div className={styles.main}>
          <div className={styles.dateRow}>
            <span className={styles.dateBig}>
              {month} {day}
            </span>
            <span className={styles.dateDetail}>
              {weekday} · {time}
            </span>
          </div>

          <h1 className={styles.title}>{event.title}</h1>

          {metaParts.length > 0 && (
            <div className={styles.metaRow}>
              {metaParts.map((part) => (
                <span key={part}>{part}</span>
              ))}
            </div>
          )}

          {event.description && <p className={styles.description}>{event.description}</p>}

          {going !== null && <p className={styles.going}>{going} going</p>}
        </div>

        <div className={styles.bookingPanel}>
          <p className={styles.bookingPrice}>
            {event.price_cents > 0 ? formatPrice(event.price_cents, event.currency) : "Free"}
            {event.price_cents > 0 && <span className={styles.bookingPriceUnit}>/pax</span>}
          </p>
          <div className={styles.bookingAction}>
            <TicketPurchase
              eventId={event.id}
              priceCents={event.price_cents}
              currency={event.currency}
              capacityRemaining={event.capacity != null ? event.capacity_remaining : null}
              signedIn={signedIn}
            />
          </div>
        </div>
      </div>
    </section>
  );
}
