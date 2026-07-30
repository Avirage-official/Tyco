import { PlayerProvider } from "@/lib/player/PlayerContext";
import { TopNav } from "./TopNav";
import { BottomNav } from "./BottomNav";
import { NowPlayingBar } from "./NowPlayingBar";
import { NowPlayingFull } from "./NowPlayingFull";
import { Footer } from "./Footer";
import { PageTransition } from "./PageTransition";
import styles from "./AppShell.module.css";

export function AppShell({ children }: { children: React.ReactNode }) {
  return (
    <PlayerProvider>
      <TopNav />
      <main className={styles.main}>
        <PageTransition>{children}</PageTransition>
        <Footer />
      </main>
      <NowPlayingBar />
      <NowPlayingFull />
      <BottomNav />
    </PlayerProvider>
  );
}
