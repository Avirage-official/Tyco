import type { Metadata, Viewport } from "next";
import { Fraunces, Jost } from "next/font/google";
import { AppShell } from "@/components/app-shell/AppShell";
import { SplashScreen } from "@/components/brand/SplashScreen";
import "./globals.css";

// Display: expressive editorial serif (stands in for the licensed "Museum"
// until real font files/license are supplied — see globals.css comment).
const fraunces = Fraunces({
  variable: "--font-fraunces",
  subsets: ["latin"],
  style: ["normal", "italic"],
  weight: ["400", "500", "600", "700"],
  display: "swap",
});

// Body/UI: geometric sans, an open-source reinterpretation of Futura.
const jost = Jost({
  variable: "--font-jost",
  subsets: ["latin"],
  weight: ["400", "500", "600"],
  display: "swap",
});

export const metadata: Metadata = {
  metadataBase: new URL("https://tyco.app"),
  title: {
    default: "Tyco",
    template: "%s · Tyco",
  },
  description:
    "Tyco — the studio journal and the retail shop, all in one place.",
  manifest: "/manifest.webmanifest",
  appleWebApp: {
    capable: true,
    statusBarStyle: "black-translucent",
    title: "Tyco",
  },
};

export const viewport: Viewport = {
  width: "device-width",
  initialScale: 1,
  themeColor: "#211c18",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" className={`${fraunces.variable} ${jost.variable}`}>
      <body>
        <SplashScreen />
        <AppShell>{children}</AppShell>
      </body>
    </html>
  );
}
