import { IconClock, IconPin } from "@/components/icons";
import { formatEventDateParts, formatPrice } from "@/lib/format";
import { StudioTabs } from "./StudioTabs";
import { TicketPurchase } from "./TicketPurchase";
import { MobileBookingBar } from "./MobileBookingBar";
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
      <div className={styles.media} aria-hidden>
        {event.cover_video_url ? (
          <video className={styles.mediaLayer} autoPlay muted loop playsInline>
            <source src={event.cover_video_url} type="video/mp4" />
          </video>
        ) : (
          <span
            className={styles.mediaLayer}
            style={event.cover_url ? { backgroundImage: `url(${event.cover_url})` } : undefined}
          />
        )}
        <span className={styles.scrim} />
      </div>

      <div className={`container ${styles.top}`}>
        <p className={styles.eyebrow}>Next up</p>
        <div className={styles.tabsSlot}>
          <StudioTabs />
        </div>
      </div>

      <div className={`container ${styles.frame}`}>
        <div className={styles.dateStack}>
          <span className={styles.dateBig}>{day}</span>
          <span className={styles.dateMonth}>{month}</span>
        </div>

        <div className={styles.body}>
          <h1 className={styles.title}>{event.title}</h1>

          <div className={styles.metaRow}>
            <span>
              <IconClock className={styles.metaIcon} />
              {weekday} · {time}
            </span>
            {event.location && (
              <span>
                <IconPin className={styles.metaIcon} />
                {event.location}
              </span>
            )}
            {event.organizer && <span>Hosted by {event.organizer}</span>}
            {going !== null && <span className={styles.going}>{going} going</span>}
          </div>

          {event.description && <p className={styles.description}>{event.description}</p>}
        </div>

        <MobileBookingBar>
          <div className={styles.bookingRow}>
            <p className={styles.bookingPrice}>
              {event.price_cents > 0 ? formatPrice(event.price_cents, event.currency) : "Free"}
              {event.price_cents > 0 && <span className={styles.bookingPriceUnit}>/pax</span>}
            </p>
            <TicketPurchase
              eventId={event.id}
              priceCents={event.price_cents}
              currency={event.currency}
              capacityRemaining={event.capacity != null ? event.capacity_remaining : null}
              signedIn={signedIn}
            />
          </div>
        </MobileBookingBar>
      </div>
    </section>
  );
}
