import Link from "next/link";
import { PageHeader } from "@/components/ui/PageHeader";
import { Spotlight, type SpotlightProps } from "@/components/home/Spotlight";
import { IconBag, IconHeart, IconPlaylist, IconUser } from "@/components/icons";
import { formatPrice } from "@/lib/format";
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

  return (
    <>
      <PageHeader eyebrow="Welcome back" title={`Hey, ${name}`} />
      <div className={`container ${styles.wrap}`}>
        {(release || event) && (
          <div className={styles.spotlightRow}>
            {release && <Spotlight {...release} />}
            {event && <Spotlight {...event} />}
          </div>
        )}

        {nextProject && (
          <div className={styles.teaser}>
            <span
              className={styles.teaserImage}
              style={nextProject.imageUrl ? { backgroundImage: `url(${nextProject.imageUrl})` } : undefined}
              aria-hidden
            />
            <div className={styles.teaserBody}>
              <span className={styles.teaserLabel}>
                <span className={styles.dot} aria-hidden />
                Coming next
              </span>
              <h2 className={styles.teaserTitle}>{nextProject.title}</h2>
              {nextProject.body && <p className={styles.teaserDesc}>{nextProject.body}</p>}
            </div>
          </div>
        )}

        {mission && mission.goalCents > 0 && (
          <div className={styles.mission}>
            <h2 className={styles.sectionTitle} style={{ marginBottom: 0 }}>
              Mission fund
            </h2>
            <div className={styles.progressTrack}>
              <div className={styles.progressFill} style={{ width: `${missionPct}%` }} />
            </div>
            <p className={styles.missionMeta}>
              {formatPrice(mission.raisedCents)} raised of {formatPrice(mission.goalCents)} goal
            </p>
          </div>
        )}

        <h2 className={styles.sectionTitle}>Your shortcuts</h2>
        <div className={styles.shortcutGrid}>
          <Link href="/music/liked" className={styles.shortcut}>
            <span className={styles.shortcutIcon}>
              <IconHeart />
            </span>
            <span>
              <span className={styles.shortcutTitle}>Liked Songs</span>
              <br />
              <span className={styles.shortcutMeta}>{likedCount} tracks</span>
            </span>
          </Link>
          <Link href="/music/library" className={styles.shortcut}>
            <span className={styles.shortcutIcon}>
              <IconPlaylist />
            </span>
            <span>
              <span className={styles.shortcutTitle}>Playlists</span>
              <br />
              <span className={styles.shortcutMeta}>{playlistCount} playlists</span>
            </span>
          </Link>
          <Link href="/account/orders" className={styles.shortcut}>
            <span className={styles.shortcutIcon}>
              <IconBag />
            </span>
            <span>
              <span className={styles.shortcutTitle}>Orders</span>
              <br />
              <span className={styles.shortcutMeta}>{orderCount} orders</span>
            </span>
          </Link>
          <Link href="/music/library" className={styles.shortcut}>
            <span className={styles.shortcutIcon}>
              <IconUser />
            </span>
            <span>
              <span className={styles.shortcutTitle}>Following</span>
              <br />
              <span className={styles.shortcutMeta}>{followedCount} artists</span>
            </span>
          </Link>
        </div>
      </div>
    </>
  );
}
