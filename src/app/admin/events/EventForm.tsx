"use client";

import { useRef, useState } from "react";
import { useRouter } from "next/navigation";
import { deleteFromBucket, uploadToBucket } from "@/lib/supabase/upload";
import { Button } from "@/components/ui/Button";
import { createEvent, updateEvent, type EventInput } from "./actions";
import styles from "../admin.module.css";

type Event = {
  id: string;
  title: string;
  description: string | null;
  location: string | null;
  organizer: string | null;
  event_date: string;
  cover_url: string | null;
  cover_video_url: string | null;
  ticket_url: string | null;
  price_cents: number;
  capacity: number | null;
};

function toLocalInputValue(iso: string | null) {
  if (!iso) return "";
  const date = new Date(iso);
  const offset = date.getTimezoneOffset();
  const local = new Date(date.getTime() - offset * 60 * 1000);
  return local.toISOString().slice(0, 16);
}

export function EventForm({ event }: { event?: Event }) {
  const router = useRouter();
  const [title, setTitle] = useState(event?.title ?? "");
  const [description, setDescription] = useState(event?.description ?? "");
  const [location, setLocation] = useState(event?.location ?? "");
  const [organizer, setOrganizer] = useState(event?.organizer ?? "");
  const [eventDate, setEventDate] = useState(toLocalInputValue(event?.event_date ?? null));
  const [ticketUrl, setTicketUrl] = useState(event?.ticket_url ?? "");
  const [price, setPrice] = useState(event ? (event.price_cents / 100).toFixed(2) : "0");
  const [capacity, setCapacity] = useState(event?.capacity != null ? String(event.capacity) : "");
  const coverUrl = event?.cover_url ?? null;
  const [coverFile, setCoverFile] = useState<File | null>(null);
  const coverVideoUrl = event?.cover_video_url ?? null;
  const [coverVideoFile, setCoverVideoFile] = useState<File | null>(null);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Captured once at mount so we know what to clean up afterward regardless
  // of how the cover state gets mutated while editing.
  const initialCoverUrl = useRef(coverUrl).current;
  const initialCoverVideoUrl = useRef(coverVideoUrl).current;

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setSaving(true);
    setError(null);

    try {
      if (!eventDate) throw new Error("Event date is required.");

      const priceCents = Math.round(parseFloat(price || "0") * 100);
      if (!Number.isFinite(priceCents) || priceCents < 0) {
        throw new Error("Enter a valid ticket price.");
      }

      const trimmedCapacity = capacity.trim();
      const capacityValue = trimmedCapacity ? Number(trimmedCapacity) : null;
      if (capacityValue !== null && (!Number.isInteger(capacityValue) || capacityValue < 0)) {
        throw new Error("Capacity must be a whole number of pax, or blank for unlimited.");
      }

      let finalCoverUrl = coverUrl;
      if (coverFile) {
        finalCoverUrl = await uploadToBucket("covers", coverFile);
      }

      let finalCoverVideoUrl = coverVideoUrl;
      if (coverVideoFile) {
        finalCoverVideoUrl = await uploadToBucket("covers", coverVideoFile);
      }

      const input: EventInput = {
        title,
        description: description || null,
        location: location || null,
        organizer: organizer || null,
        event_date: new Date(eventDate).toISOString(),
        cover_url: finalCoverUrl,
        cover_video_url: finalCoverVideoUrl,
        ticket_url: ticketUrl || null,
        price_cents: priceCents,
        capacity: capacityValue,
      };

      if (event) {
        await updateEvent(event.id, input);
      } else {
        await createEvent(input);
      }

      // Save succeeded — now safe to clean up whatever it orphaned.
      // Best-effort: a cleanup failure shouldn't surface as a save failure.
      const toDelete: Promise<void>[] = [];
      if (finalCoverUrl !== initialCoverUrl && initialCoverUrl) {
        toDelete.push(deleteFromBucket("covers", initialCoverUrl));
      }
      if (finalCoverVideoUrl !== initialCoverVideoUrl && initialCoverVideoUrl) {
        toDelete.push(deleteFromBucket("covers", initialCoverVideoUrl));
      }
      await Promise.allSettled(toDelete);

      router.push("/admin/events");
      router.refresh();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Something went wrong");
      setSaving(false);
    }
  }

  return (
    <form className={styles.form} onSubmit={handleSubmit}>
      <div className={styles.field}>
        <label className={styles.label} htmlFor="title">
          Title
        </label>
        <input
          id="title"
          className={styles.input}
          required
          value={title}
          onChange={(e) => setTitle(e.target.value)}
        />
      </div>

      <div className={styles.fieldRow}>
        <div className={styles.field}>
          <label className={styles.label} htmlFor="event_date">
            Date &amp; time
          </label>
          <input
            id="event_date"
            type="datetime-local"
            className={styles.input}
            required
            value={eventDate}
            onChange={(e) => setEventDate(e.target.value)}
          />
        </div>
        <div className={styles.field}>
          <label className={styles.label} htmlFor="location">
            Location
          </label>
          <input
            id="location"
            className={styles.input}
            value={location}
            onChange={(e) => setLocation(e.target.value)}
          />
        </div>
      </div>

      <div className={styles.field}>
        <label className={styles.label} htmlFor="organizer">
          Organizer
        </label>
        <input
          id="organizer"
          className={styles.input}
          placeholder="Leave blank if it's a Tyco event"
          value={organizer}
          onChange={(e) => setOrganizer(e.target.value)}
        />
        <p className={styles.hint}>
          Set this when a third party is hosting — shows as &ldquo;Hosted by&rdquo; on the event.
        </p>
      </div>

      <div className={styles.fieldRow}>
        <div className={styles.field}>
          <label className={styles.label} htmlFor="price">
            Ticket price (SGD)
          </label>
          <input
            id="price"
            type="number"
            min="0"
            step="0.01"
            className={styles.input}
            value={price}
            onChange={(e) => setPrice(e.target.value)}
          />
          <p className={styles.hint}>0 for free entry — tickets are still tracked and checked in.</p>
        </div>
        <div className={styles.field}>
          <label className={styles.label} htmlFor="capacity">
            Capacity (pax)
          </label>
          <input
            id="capacity"
            type="number"
            min="0"
            step="1"
            className={styles.input}
            placeholder="Unlimited"
            value={capacity}
            onChange={(e) => setCapacity(e.target.value)}
          />
          <p className={styles.hint}>Leave blank for no cap.</p>
        </div>
      </div>

      <div className={styles.field}>
        <label className={styles.label} htmlFor="description">
          Description
        </label>
        <textarea
          id="description"
          className={styles.textarea}
          value={description}
          onChange={(e) => setDescription(e.target.value)}
        />
      </div>

      <div className={styles.field}>
        <label className={styles.label} htmlFor="ticket_url">
          Ticket link
        </label>
        <input
          id="ticket_url"
          type="url"
          className={styles.input}
          placeholder="https://…"
          value={ticketUrl}
          onChange={(e) => setTicketUrl(e.target.value)}
        />
      </div>

      <div className={styles.field}>
        <label className={styles.label} htmlFor="cover">
          Cover image
        </label>
        {coverUrl && <div className={styles.preview} style={{ backgroundImage: `url(${coverUrl})` }} />}
        <input
          id="cover"
          type="file"
          accept="image/*"
          onChange={(e) => setCoverFile(e.target.files?.[0] ?? null)}
        />
      </div>

      <div className={styles.field}>
        <label className={styles.label} htmlFor="cover_video">
          Cover video (optional)
        </label>
        {coverVideoUrl && (
          <video
            className={styles.preview}
            src={coverVideoUrl}
            muted
            loop
            autoPlay
            playsInline
          />
        )}
        <input
          id="cover_video"
          type="file"
          accept="video/*"
          onChange={(e) => setCoverVideoFile(e.target.files?.[0] ?? null)}
        />
        <p className={styles.hint}>
          A short looping clip for this event&rsquo;s hero, if it&rsquo;s the next one coming up.
          Falls back to the cover image when blank.
        </p>
      </div>

      {error && <p className={styles.error}>{error}</p>}

      <div className={styles.formActions}>
        <Button type="submit" disabled={saving}>
          {saving ? "Saving…" : event ? "Save changes" : "Create event"}
        </Button>
      </div>
    </form>
  );
}
