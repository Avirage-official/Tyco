import { IconCalendar, IconClock, IconPin, IconTicket } from "@/components/icons";
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

        {(event.location || event.organizer) && (
          <div className={styles.tagRow}>
            {event.location && (
              <span className={styles.tag}>
                <IconPin className={styles.tagIcon} />
                {event.location}
              </span>
            )}
            {event.organizer && <span className={styles.tag}>{event.organizer}</span>}
          </div>
        )}
      </div>

      <div className={styles.body}>
        <div className={styles.main}>
          <h1 className={styles.title}>{event.title}</h1>
          {event.description && <p className={styles.description}>{event.description}</p>}

          <div className={styles.infoGrid}>
            <div className={styles.infoCard}>
              <IconCalendar className={styles.infoIcon} />
              <span className={styles.infoLabel}>Date</span>
              <span className={styles.infoValue}>
                {month} {day}
              </span>
            </div>
            <div className={styles.infoCard}>
              <IconClock className={styles.infoIcon} />
              <span className={styles.infoLabel}>Time</span>
              <span className={styles.infoValue}>{time}</span>
            </div>
            {event.location && (
              <div className={styles.infoCard}>
                <IconPin className={styles.infoIcon} />
                <span className={styles.infoLabel}>Venue</span>
                <span className={styles.infoValue}>{event.location}</span>
              </div>
            )}
            <div className={styles.infoCard}>
              <IconTicket className={styles.infoIcon} />
              <span className={styles.infoLabel}>Seats</span>
              <span className={styles.infoValue}>
                {event.capacity != null ? `${event.capacity_remaining} left` : "Open"}
              </span>
            </div>
          </div>

          {(event.organizer || going !== null) && (
            <div className={styles.hostCard}>
              {event.organizer && <span>Hosted by {event.organizer}</span>}
              {going !== null && <span>{going} going</span>}
            </div>
          )}
        </div>

        <div className={styles.bookingCard}>
          <p className={styles.bookingPrice}>
            {event.price_cents > 0 ? formatPrice(event.price_cents, event.currency) : "Free"}
            {event.price_cents > 0 && <span className={styles.bookingPriceUnit}>/pax</span>}
          </p>
          <p className={styles.bookingHint}>{weekday}, {month} {day}</p>
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
