import { CartProvider } from "@/lib/cart/CartContext";
import { TopNav } from "./TopNav";
import { MobileTopBar } from "./MobileTopBar";
import { Footer } from "./Footer";
import { PageTransition } from "./PageTransition";
import styles from "./AppShell.module.css";

export function AppShell({ children }: { children: React.ReactNode }) {
  return (
    <CartProvider>
      <TopNav />
      <MobileTopBar />
      <main className={styles.main}>
        <PageTransition>{children}</PageTransition>
        <Footer />
      </main>
    </CartProvider>
  );
}
