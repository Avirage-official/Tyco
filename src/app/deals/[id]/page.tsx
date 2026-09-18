import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { Accordion } from "@/components/ui/Accordion";
import { CoverImage } from "@/components/ui/CoverImage";
import { ParallaxMedia } from "@/components/ui/ParallaxMedia";
import { SectionHeader } from "@/components/ui/SectionHeader";
import { StickyBarSpacer } from "@/components/ui/StickyBar";
import { IconPin } from "@/components/icons";
import { createClient } from "@/lib/supabase/server";
import { getDealCatalog } from "@/lib/deals/catalog";
import { DealsGrid } from "../DealsGrid";
import { RedeemPanel } from "./RedeemPanel";
import styles from "./deal.module.css";

type Params = { params: Promise<{ id: string }> };

export async function generateMetadata({ params }: Params): Promise<Metadata> {
  const { id } = await params;
  const supabase = await createClient();
  const { deals } = await getDealCatalog(supabase);
  const deal = deals.find((d) => d.id === id);
  if (!deal) return { title: "Deal not found" };
  return {
    title: `${deal.title} at ${deal.vendorName}`,
    description: deal.description ?? `A member deal from ${deal.vendorName} on Tyco.`,
    openGraph: deal.coverUrl ? { images: [{ url: deal.coverUrl }] } : undefined,
  };
}

const HOW_IT_WORKS = [
  { title: "Redeem online", body: "Pay the member price here and the deal is reserved for you." },
  { title: "Get your code", body: "A short reference code appears under Your deals right away." },
  { title: "Show it at the counter", body: "Staff check the code and mark it as used. One code, one visit." },
];

export default async function DealPage({ params }: Params) {
  const { id } = await params;
  const supabase = await createClient();
  const [{ deals }, userData] = await Promise.all([getDealCatalog(supabase), supabase.auth.getUser()]);

  const deal = deals.find((d) => d.id === id);
  if (!deal) notFound();

  const moreFromVendor = deals.filter((d) => d.vendorId === deal.vendorId && d.id !== deal.id).slice(0, 4);
  const signedIn = Boolean(userData.data.user);

  return (
    <article className={`container ${styles.page}`}>
      <nav className={styles.breadcrumb} aria-label="Breadcrumb">
        <Link href="/deals">Deals</Link>
        <span aria-hidden>/</span>
        <Link href={`/deals?category=${deal.categoryId}`}>{deal.categoryName}</Link>
      </nav>

      <ParallaxMedia className={styles.media}>
        <CoverImage
          src={deal.coverUrl}
          alt={`${deal.title} at ${deal.vendorName}`}
          sizes="(min-width: 1180px) 1132px, 100vw"
          priority
        />
      </ParallaxMedia>

      <div className={styles.columns}>
        <div className={styles.main}>
          <header className={styles.header}>
            <p className={styles.vendor}>{deal.vendorName}</p>
            <h1 className={styles.title}>{deal.title}</h1>
            <p className={styles.meta}>
              <span>{deal.subcategoryName}</span>
              {deal.locations.length > 0 && (
                <span className={styles.metaLocation}>
                  <IconPin />
                  {deal.locations.join(" · ")}
                </span>
              )}
            </p>
          </header>

          {deal.description && (
            <section className={styles.section}>
              <h2 className={styles.sectionTitle}>About this deal</h2>
              <p className={styles.prose}>{deal.description}</p>
            </section>
          )}

          <section className={styles.section}>
            <h2 className={styles.sectionTitle}>How it works</h2>
            <ol className={styles.steps}>
              {HOW_IT_WORKS.map((step, i) => (
                <li key={step.title} className={styles.step}>
                  <span className={styles.stepNumber} aria-hidden>
                    {i + 1}
                  </span>
                  <span>
                    <span className={styles.stepTitle}>{step.title}</span>
                    <span className={styles.stepBody}>{step.body}</span>
                  </span>
                </li>
              ))}
            </ol>
          </section>

          <section className={styles.section}>
            <Accordion title="Deal terms">
              <p>
                Each redemption is final and non-refundable once paid. Your reference code is valid for one
                visit to {deal.vendorName}, and monthly availability resets on the first of the month. The full
                terms are in our{" "}
                <Link href="/terms#deals" className={styles.inlineLink}>
                  Terms &amp; Conditions
                </Link>
                .
              </p>
            </Accordion>
          </section>
        </div>

        <aside className={styles.side}>
          <RedeemPanel
            dealId={deal.id}
            title={deal.title}
            vendorName={deal.vendorName}
            memberPriceCents={deal.memberPriceCents}
            originalPriceCents={deal.originalPriceCents}
            currency={deal.currency}
            capRemaining={deal.capRemaining}
            signedIn={signedIn}
          />
        </aside>
      </div>

      {moreFromVendor.length > 0 && (
        <section className={styles.more}>
          <SectionHeader title={`More from ${deal.vendorName}`} />
          <DealsGrid deals={moreFromVendor} />
        </section>
      )}

      <StickyBarSpacer />
    </article>
  );
}
