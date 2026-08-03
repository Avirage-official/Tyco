import Link from "next/link";
import { PageHeader } from "@/components/ui/PageHeader";
import type { SpotlightProps } from "@/components/home/Spotlight";
import { IconBag, IconHeart, IconPlaylist, IconUser } from "@/components/icons";
import { formatDate, formatPrice } from "@/lib/format";
import styles from "./Dashboard.module.css";

export type DashboardProps = {
  name: string;
  release: SpotlightProps | null;
  event: SpotlightProps | null;
  nextProject: { title: string; body: string | null; imageUrl: string | null } | null;
  mission: { raisedCents: number; goalCents: number } | null;
  likedCount: number;
  playlistCount: number;
  orderCount: number;
  followedCount: number;
};

function FeatureCard({ item }: { item: SpotlightProps }) {
  const label = item.kind === "event" ? "Next up" : "Latest release";
  const meta =
    item.kind === "event"
      ? [formatDate(item.date), item.location].filter(Boolean).join(" · ")
      : [item.artist, formatDate(item.date)].filter(Boolean).join(" · ");

  return (
    <Link href={item.href} className={styles.feature}>
      <span
        className={styles.featureBg}
        style={item.coverUrl ? { backgroundImage: `url(${item.coverUrl})` } : undefined}
        aria-hidden
      />
      <span className={styles.featureScrim} aria-hidden />
      <div className={styles.featureBody}>
        <span className={styles.tag}>
          <span className={styles.tagDot} aria-hidden />
          {label}
        </span>
        <h2 className={styles.featureTitle}>{item.title}</h2>
        <p className={styles.featureMeta}>{meta}</p>
      </div>
    </Link>
  );
}

export function Dashboard({
  name,
  release,
  event,
  nextProject,
  mission,
  likedCount,
  playlistCount,
  orderCount,
  followedCount,
}: DashboardProps) {
  const missionPct =
    mission && mission.goalCents > 0
      ? Math.min(100, Math.round((mission.raisedCents / mission.goalCents) * 100))
      : 0;
  const soloSecondary = Boolean(nextProject) !== Boolean(mission && mission.goalCents > 0);

  return (
    <>
      <PageHeader eyebrow="Welcome back" title={`Hey, ${name}`} />
      <div className={`container ${styles.wrap}`}>
        {(release || event) && (
          <div className={styles.heroRow}>
            {release && <FeatureCard item={release} />}
            {event && <FeatureCard item={event} />}
          </div>
        )}

        {(nextProject || (mission && mission.goalCents > 0)) && (
          <div className={styles.secondaryRow}>
            {nextProject && (
              <Link
                href="/studio"
                className={styles.feature}
                style={soloSecondary ? { gridColumn: "1 / -1" } : undefined}
              >
                <span
                  className={styles.featureBg}
                  style={nextProject.imageUrl ? { backgroundImage: `url(${nextProject.imageUrl})` } : undefined}
                  aria-hidden
                />
                <span className={styles.featureScrim} aria-hidden />
                <div className={styles.featureBody}>
                  <span className={styles.tag}>
                    <span className={styles.tagDot} aria-hidden />
                    Coming next
                  </span>
                  <h2 className={styles.featureTitle}>{nextProject.title}</h2>
                  {nextProject.body && <p className={styles.featureMeta}>{nextProject.body}</p>}
                </div>
              </Link>
            )}

            {mission && mission.goalCents > 0 && (
              <div
                className={styles.mission}
                style={soloSecondary ? { gridColumn: "1 / -1" } : undefined}
              >
                <span className={styles.tag}>
                  <span className={styles.tagDot} aria-hidden />
                  Mission fund
                </span>
                <p className={styles.missionAmount}>{formatPrice(mission.raisedCents)}</p>
                <p className={styles.missionGoal}>raised of {formatPrice(mission.goalCents)} goal</p>
                <div className={styles.progressTrack}>
                  <div className={styles.progressFill} style={{ width: `${missionPct}%` }} />
                </div>
              </div>
            )}
          </div>
        )}

        <p className="eyebrow">Quick access</p>
        <h2 className={styles.sectionTitle}>Your shortcuts</h2>
        <div className={styles.shortcutGrid}>
          <Link href="/music/liked" className={styles.shortcut}>
            <span className={styles.shortcutIcon}>
              <IconHeart />
            </span>
            <p className={styles.shortcutCount}>{likedCount}</p>
            <p className={styles.shortcutLabel}>Liked Songs</p>
          </Link>
          <Link href="/music/library" className={styles.shortcut}>
            <span className={styles.shortcutIcon}>
              <IconPlaylist />
            </span>
            <p className={styles.shortcutCount}>{playlistCount}</p>
            <p className={styles.shortcutLabel}>Playlists</p>
          </Link>
          <Link href="/account/orders" className={styles.shortcut}>
            <span className={styles.shortcutIcon}>
              <IconBag />
            </span>
            <p className={styles.shortcutCount}>{orderCount}</p>
            <p className={styles.shortcutLabel}>Orders</p>
          </Link>
          <Link href="/music/library" className={styles.shortcut}>
            <span className={styles.shortcutIcon}>
              <IconUser />
            </span>
            <p className={styles.shortcutCount}>{followedCount}</p>
            <p className={styles.shortcutLabel}>Following</p>
          </Link>
        </div>
      </div>
    </>
  );
}
