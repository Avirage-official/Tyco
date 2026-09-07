# Happenings page — full-bleed editorial redesign

Living spec for the `/studio` (Happenings) page. Scope is deliberately
narrow: **`/studio` only** (the events/Happenings listing — hero, "More
dates" grid, "Past events" strip, plus the shared sidebar/tabs/banner
chrome, which Happenings now opts out of). `/studio/deals` keeps its
existing dark theme, sidebar/tabs/banner shell, and overlay-style cards —
the user said "the happenings page," not deals.

This supersedes the previous light-cream-theme direction below (kept as
history, not as the current design).

## Why the last two attempts still read as "vibe coded"

- **Attempt 1** (dark, PR #54): kept the sitewide full-bleed
  photo-with-text-overlay anatomy but the sections met at flat 1px/2px
  ruled lines (`border-top: 2px solid var(--accent)` on the booking
  panel, a bordered "Coming soon" placeholder box, a hairline under the
  "going" count) — the generic tell of a component-kit page, not
  full-bleed editorial design.
- **Attempt 2** (light cream theme, this doc's original version): fixed
  nothing about the dividers, and additionally flipped the page to an
  isolated light palette disconnected from the rest of the dark site,
  reused a generic "image-top, plain-white-body-below" product-card
  anatomy for the grid, and kept a permanent 240px dashboard sidebar for
  a two-item nav. All three are exactly the componentized, assembled-
  from-a-template shapes that read as generic rather than art-directed.

## What changed

- **Theme**: reverted to the site's own dark palette — no more scoped
  light-mode override. `SwipeDashboard` (shared with the homepage) now
  renders in the same dark tokens everywhere instead of inheriting a
  page-local theme flip.
- **Chrome**: Happenings no longer renders the shared `PageHeader` +
  `StudioSidebar` + `StudioFeatureBanner` dashboard shell (`StudioChrome`
  now branches on route — Deals still gets the full shell, unchanged).
  The page owns its own full-bleed layout instead.
- **Hero** (`EventHero`): full-bleed, edge to edge, ~86dvh tall. The
  event date is a large graphic detail (day number + month) sitting
  beside the title, not a small text badge on a boxed photo. The
  "Happenings / Deals" switcher (`StudioTabs`) is folded into the hero's
  own top bar instead of a separate sidebar or mobile-only tab strip.
  The booking row (price + `TicketPurchase`) sits inline in the hero's
  scrim with no bordered panel; on mobile it's a blurred, gradient-faded
  dock at the bottom of the screen instead of a flat-bordered bar.
- **Divider technique**: every hard 1px/2px rule is gone from this page.
  Section boundaries either fade into the shared `--bg` token (hero →
  marquee → grid, same gradient-to-`--bg` technique used on the
  homepage hero) or are replaced by the marquee itself.
- **Marquee** (new, `Marquee.tsx`): a slow, seamlessly looping strip of
  brand phrases (`Happenings · Studio Nights · Live Sets · Tyco`) used
  as the transition device between the hero and the grid — the
  "divider" is moving content, not a ruled line. Hand-built (a
  duplicated-track CSS `@keyframes` loop, masked at its own edges),
  `aria-hidden` since it's decorative, and disabled under
  `prefers-reduced-motion`.
- **"More dates" grid**: replaced the boxed image-top/white-body card
  with the same full-bleed poster anatomy already used by the Deals grid
  (`.eventPoster*` mirrors `.posterCard*`) — one card idiom for "browse a
  bunch of these" grids across the site, not two competing ones on the
  same page.
- **Ticket controls**: `.ticketCta` and `.qtyStepper` moved off the
  sitewide 2px "sharp" radius token onto a full pill radius, local to
  this page's controls.
- **Detail modal** (shared by Deals): the flat `border-top: 2px solid
  var(--accent)` booking-panel divider is gone (spacing only now) and a
  stale near-black scrim color was brought in line with the current
  `--ink`. This is the one shared-component change — it's a hairline fix
  identical in spirit to the rest of this pass, and it also touches
  Deals' modal, but not Deals' browsing-layer cards or theme.

## Explicitly excluded / deferred (unchanged from earlier decisions)

- Event category chips on cards — event category taxonomy doesn't exist
  yet, deferred to later.
- "+" quick-add buttons — bypasses the details-before-purchase flow that
  was deliberately built; still excluded.
- Wishlist hearts, star ratings — no backing data; excluded per the
  no-fabricated-data rule.
- Marquee copy is limited to the brand's own section names (no invented
  stats or claims), for the same reason.
