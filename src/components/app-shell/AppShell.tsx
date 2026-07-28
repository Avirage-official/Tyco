import { PlayerProvider } from "@/lib/player/PlayerContext";
import { TopNav } from "./TopNav";
import { BottomNav } from "./BottomNav";
import { NowPlayingBar } from "./NowPlayingBar";
import styles from "./AppShell.module.css";

export function AppShell({ children }: { children: React.ReactNode }) {
  return (
    <PlayerProvider>
      <TopNav />
      <main className={styles.main}>{children}</main>
      <NowPlayingBar />
      <BottomNav />
    </PlayerProvider>
  );
}
