import { Chip, ChipGroup } from "@/components/ui/Chip";
import type { DealCategory } from "@/lib/deals/catalog";
import styles from "./deals.module.css";

function hrefFor(categoryId: string | null, location: string | null) {
  const params = new URLSearchParams();
  if (categoryId) params.set("category", categoryId);
  if (location) params.set("location", location);
  const query = params.toString();
  return query ? `/deals?${query}` : "/deals";
}

/**
 * The sticky filter bar under the header: category chips, and a second
 * row of location chips only when deals span more than one location.
 * Filters live in the URL so a filtered view is shareable and survives
 * a refresh.
 */
export function DealFilters({
  categories,
  locations,
  activeCategoryId,
  activeLocation,
}: {
  categories: DealCategory[];
  locations: string[];
  activeCategoryId: string | null;
  activeLocation: string | null;
}) {
  const showCategories = categories.length > 1;
  const showLocations = locations.length > 1;
  if (!showCategories && !showLocations) return null;

  return (
    <div className={styles.filters}>
      <div className={`container container--wide ${styles.filtersInner}`}>
        {showCategories && (
          <ChipGroup label="Filter by category">
            <Chip href={hrefFor(null, activeLocation)} active={activeCategoryId === null}>
              All
            </Chip>
            {categories.map((category) => (
              <Chip
                key={category.id}
                href={hrefFor(category.id, activeLocation)}
                active={activeCategoryId === category.id}
              >
                {category.name}
              </Chip>
            ))}
          </ChipGroup>
        )}
        {showLocations && (
          <ChipGroup label="Filter by location">
            <Chip href={hrefFor(activeCategoryId, null)} active={activeLocation === null}>
              Everywhere
            </Chip>
            {locations.map((location) => (
              <Chip key={location} href={hrefFor(activeCategoryId, location)} active={activeLocation === location}>
                {location}
              </Chip>
            ))}
          </ChipGroup>
        )}
      </div>
    </div>
  );
}
