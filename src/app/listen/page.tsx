import type { Metadata } from "next";
import { EmptyState } from "@/components/ui/EmptyState";
import { createClient } from "@/lib/supabase/server";
import { ListenRail, type Release } from "./ListenRail";
import { ListenArchive } from "./ListenArchive";
import styles from "./listen.module.css";

export const metadata: Metadata = {
  title: "Listen",
  description: "New music from artists across Asia, picked for the Tyco scene.",
};

/** How many the rail carries before the rest drops into the archive below. */
const RAIL_LIMIT = 12;

/**
 * Reference: COLORS Studios' Listen page — square tiles on a rail held in
 * the middle of the screen, bleeding off both edges, over a backdrop
 * blurred past recognition. What is borrowed is the structure and the
 * restraint; the typeface and the palette are Tyco's own.
 *
 * The tile face is flat colour rather than the artwork, because the
 * artwork here is a YouTube thumbnail and those nearly always have the
 * artist and track already printed on them — the tile would say the same
 * words twice in two different fonts. The thumbnail earns its place as
 * the backdrop instead, where blur makes the mess into atmosphere.
 */
export default async function ListenPage() {
  const supabase = await createClient();

  const { data } = await supabase
    .from("feed_items")
    .select("id, title, cover_url, source_url, source_channel, release_date, published_at")
    .eq("is_published", true)
    .eq("type", "release")
    .order("release_date", { ascending: false, nullsFirst: false })
    .limit(60);

  const releases: Release[] = (data ?? []).map((item) => ({
    id: item.id,
    title: item.title,
    coverUrl: item.cover_url,
    channel: item.source_channel,
    date: item.release_date ?? item.published_at,
    href: item.source_url,
  }));

  if (releases.length === 0) {
    return (
      <div className={`container ${styles.empty}`}>
        <EmptyState
          title="Nothing to play yet"
          description="New music from artists across Asia lands here as it comes out."
        />
      </div>
    );
  }

  return (
    <>
      <ListenRail releases={releases.slice(0, RAIL_LIMIT)} />
      {releases.length > RAIL_LIMIT && <ListenArchive releases={releases.slice(RAIL_LIMIT)} />}
    </>
  );
}
