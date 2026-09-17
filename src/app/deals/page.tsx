import type { Metadata } from "next";
import { PageHeader } from "@/components/ui/PageHeader";
import { EmptyState } from "@/components/ui/EmptyState";
import { SectionHeader } from "@/components/ui/SectionHeader";
import { createClient } from "@/lib/supabase/server";
import { getDealCatalog } from "@/lib/deals/catalog";
import { DealFilters } from "./DealFilters";
import { DealsGrid } from "./DealsGrid";
import styles from "./deals.module.css";

export const metadata: Metadata = {
  title: "Deals",
  description: "Member prices at the studios, shops and services creatives already spend on.",
};

export default async function DealsPage({
  searchParams,
}: {
  searchParams: Promise<{ category?: string; location?: string }>;
}) {
  const { category: categoryId, location } = await searchParams;
  const supabase = await createClient();
  const { deals, categories } = await getDealCatalog(supabase);

  const locations = Array.from(new Set(deals.flatMap((d) => d.locations))).sort();
  const activeCategory = categories.find((c) => c.id === categoryId) ?? null;
  const activeLocation = location && locations.includes(location) ? location : null;

  const filtered = deals.filter(
    (d) =>
      (!activeCategory || d.categoryId === activeCategory.id) &&
      (!activeLocation || d.locations.includes(activeLocation))
  );

  return (
    <>
      <PageHeader
        title="Deals"
        description="Member prices at the studios, shops and services creatives already spend on."
        wide
      />

      {deals.length === 0 ? (
        <div className="container container--wide">
          <EmptyState
            title="No deals yet"
            description="Deals from partner vendors will show up here as they're published."
          />
        </div>
      ) : (
        <>
          <DealFilters
            categories={categories}
            locations={locations}
            activeCategoryId={activeCategory?.id ?? null}
            activeLocation={activeLocation}
          />

          <div className={`container container--wide ${styles.body}`}>
            {filtered.length === 0 ? (
              <EmptyState
                title="Nothing matches those filters"
                description="Try another category or location."
              />
            ) : activeCategory ? (
              <DealsGrid deals={filtered} />
            ) : (
              categories.map((category) => {
                const inCategory = filtered.filter((d) => d.categoryId === category.id);
                if (inCategory.length === 0) return null;
                return (
                  <section key={category.id} className={styles.section}>
                    <SectionHeader
                      title={category.name}
                      action={
                        inCategory.length > 4
                          ? { href: `/deals?category=${category.id}`, label: "See all" }
                          : undefined
                      }
                    />
                    <DealsGrid deals={inCategory} />
                  </section>
                );
              })
            )}
          </div>
        </>
      )}
    </>
  );
}
