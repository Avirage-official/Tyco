# Tyco design system

The single source of truth for how Tyco's public pages look, move, and are
built. It replaces the earlier `ui-design-system.md` and
`happenings-mobile-redesign.md`, both of which described directions that
were never shipped or have since been superseded.

Scope: every public page. The admin panel (`/admin/*`) is out of scope and
keeps its current utilitarian styling.

## 1. Goal and principles

Tyco should read as a product built by a professional team, in the way
Airbnb, DICE, Fever or Resident Advisor do. Not as an editorial art piece,
and not as a template. Every decision below follows from four rules:

1. **Content first.** Real photos, real names, real prices. Chrome exists
   to frame content, never to fill the screen on its own.
2. **One card, one header, one button.** A single anatomy for each
   component, reused everywhere. No page-local variants of shared parts.
3. **Detail pages, not modals.** Anything a user might want to share, save
   or come back to gets a URL.
4. **Quiet motion.** Motion confirms actions and guides the eye. It never
   runs continuously, never hijacks scroll, and always respects
   `prefers-reduced-motion`.

## 2. Stack constraints

- **Styling**: hand-written CSS Modules plus the token layer in
  `src/app/globals.css`. No Tailwind, no component libraries, no AI-generated
  UI kits. Every colour, size, radius and duration goes through a token.
- **Motion**: the `motion` package (`motion/react`) is the only animation
  dependency. Shared variants live in `src/lib/motion/variants.ts`.
- **Fonts**: Fraunces (display) and Jost (body/UI) via `next/font/google`,
  exposed as `--font-display` and `--font-body`. Both are open-source
  foundry releases. They stay until licensed brand fonts arrive, at which
  point only `layout.tsx` and the two tokens change.
- **Images**: `next/image` with real `alt` text for every content image.
  `background-image` is reserved for purely decorative surfaces.

## 3. Patterns being removed

These recur across the current codebase and are the things that make it
read as generated rather than designed. They go, sitewide, as each page is
touched:

| Pattern | Where it lives today | Replacement |
|---|---|---|
| Numbered indexes on nav links and section labels ("01 —") | `DesktopNav`, `SwipeDashboard`, `WhoWeAreHero` | Plain labels |
| Uppercase red eyebrow above every heading | `.eyebrow` utility, most pages | Headings carry their own hierarchy; eyebrows only where a section genuinely needs a category label |
| Marquee strips as section dividers | `Marquee.tsx` on Happenings, Shop, Journal | Whitespace and section headings |
| Full-viewport horizontal swipe carousel | `SwipeDashboard` on Home, Happenings, Shop | Vertical card rows |
| Forced grayscale on photos plus red multiply blend | `EventHero`, `EventCard`, `DealCard`, `SwipeDashboard`, `FeaturedShop` | Photos in colour with a light bottom scrim only where text overlaps |
| Film-grain noise on `body` | `globals.css` | Flat background |
| Italic serif taglines and manifesto copy | `WhoWeAreHero`, `Footer`, `Marketing` | Plain product copy |
| Splash screen on first visit | `SplashScreen.tsx` | Removed |
| Orbiting-arc page loader | `Loader.tsx`, every `loading.tsx` | Skeleton placeholders shaped like the content |
| Full-screen `<dialog>` for event and deal detail | `EventCard`, `DealCard`, `Modal.tsx` | Detail routes |
| Gradient hairlines fading in from the edges | `TopNav`, `Footer` | A single 1px `--border` line, or none |
| Page transition that rises 10px on every route change | `PageTransition.tsx` | 200ms cross-fade |

## 4. Colour

Dark theme, kept. The base stays the warm charcoal already in production.
The change is a second, complementary accent: red stays the brand and CTA
colour, and a teal joins it for states that should not shout (availability,
success, informational badges, secondary highlights). Red and teal sit
opposite on the wheel, so they separate cleanly at a glance.

```css
:root {
  /* base */
  --ink:          #211c18;   /* page background */
  --ink-soft:     #2c2622;   /* raised surface (cards, sheets, nav) */
  --ink-softer:   #3a3229;   /* second raised level (inputs on cards, hover) */
  --border:       #4a4037;   /* 1px lines; use sparingly */
  --border-strong:#6a5d51;   /* focus rings, selected outlines */

  /* text */
  --fg:           #f4ecdc;   /* primary text on dark */
  --fg-muted:     #b9ad98;   /* secondary text, meta */
  --fg-faint:     #8a7f6d;   /* placeholders, disabled */

  /* brand accent (primary actions, brand marks) */
  --red:          #d63a2a;
  --red-hover:    #e9503f;
  --red-pressed:  #b52f21;
  --red-soft:     rgba(214, 58, 42, 0.16);
  --on-red:       #fff7ec;

  /* complementary accent (availability, success, info, secondary emphasis) */
  --teal:         #3fb8a8;
  --teal-hover:   #5fd0c0;
  --teal-pressed: #2f9a8c;
  --teal-soft:    rgba(63, 184, 168, 0.16);
  --on-teal:      #0f1a18;

  /* semantic aliases: components use these, never the raw names above */
  --bg:            var(--ink);
  --surface:       var(--ink-soft);
  --surface-2:     var(--ink-softer);
  --accent:        var(--red);
  --accent-hover:  var(--red-hover);
  --accent-soft:   var(--red-soft);
  --on-accent:     var(--on-red);
  --accent-2:      var(--teal);
  --accent-2-hover:var(--teal-hover);
  --accent-2-soft: var(--teal-soft);
  --on-accent-2:   var(--on-teal);
  --danger:        var(--red);
  --success:       var(--teal);

  /* overlays for text on photos: rgba of --ink, never a hex copy */
  --scrim-weak:   rgba(33, 28, 24, 0.35);
  --scrim-strong: rgba(33, 28, 24, 0.80);
}
```

Usage rules:

- **Red** for the single primary action on a screen, the active nav state,
  the wordmark dot, price emphasis, and errors.
- **Teal** for "N left this month", "Free entry", ticket paid/checked-in
  states, success toasts, new-item badges, and links inside body copy.
- Never both accents on the same element. Never teal as a button fill next
  to a red button.
- Contrast: `--fg` on `--ink` is above 12:1. `--teal` on `--ink` is above
  7:1. `--on-red` on `--red` is above 4.5:1. Any new token must clear WCAG AA
  for its intended pairing before it's added.
- Scrim colours reference the ink RGB once here. Components stop
  hard-coding `rgba(33, 28, 24, …)`.

## 5. Typography

Display: Fraunces. Body and UI: Jost. One modular scale, applied through
tokens so pages don't define their own sizes:

| Token | Size (mobile → desktop) | Use |
|---|---|---|
| `--text-display` | 2.4rem → 3.6rem | Hero headline, one per page max |
| `--text-h1` | 1.9rem → 2.6rem | Page title |
| `--text-h2` | 1.4rem → 1.8rem | Section title |
| `--text-h3` | 1.1rem → 1.2rem | Card title |
| `--text-body` | 1rem | Paragraphs |
| `--text-sm` | 0.875rem | Meta, helper text |
| `--text-xs` | 0.75rem | Badges, labels |

- Headings use `--font-display` at weight 600, line-height 1.1, tracking
  `-0.01em`. No italics in headings.
- Body uses `--font-body` at weight 400, line-height 1.5. UI labels use 500.
- Uppercase tracking is allowed only on `--text-xs` badges and chips.
- Max measure for running text: 65ch.

## 6. Spacing, radius, elevation

- Spacing scale unchanged: `--space-3xs` (4px) through `--space-2xl` (96px).
  Section rhythm on a page is `--space-xl` between sections on mobile,
  `--space-2xl` on desktop.
- Radii: `--radius-sm` 6px (chips, inputs), `--radius-md` 12px (cards),
  `--radius-lg` 20px (sheets, modals), `--radius-pill` for pills only. The
  2px "sharp" radius is retired.
- Elevation: cards on `--surface` with no border by default. A `--border`
  line only when two surfaces of the same colour touch. Shadows are for
  floating layers only (sheets, menus, sticky bars):
  `0 12px 32px rgba(0,0,0,.35)`.
- Content widths: one `.container` at 1180px for text-heavy pages, one
  `.container--wide` at 1440px for card grids. The 1920px poster-wall cap is
  retired.

## 7. Components

Shared components live in `src/components/ui`. Pages compose them; pages do
not restyle them.

- **Button**: `primary` (red fill), `secondary` (surface-2 fill, fg text),
  `ghost` (no fill, border), `link`. Heights 44px default, 36px small.
  Pill radius. Press scale 0.97 via `motion`. Full-width variant for mobile
  sticky bars.
- **Card**: media on top at a fixed aspect ratio (4:3 for deals, 3:4 for
  event posters, 1:1 for products), `--surface` body below, `--radius-md`,
  no border. Hover: image scales 1.03 inside its clip, card lifts 2px. The
  whole card is one link.
- **Chip**: filter and category pills, 32px tall, `--surface-2` fill,
  active state `--fg` fill with `--bg` text. Active indicator animates
  between chips with a `layoutId`.
- **Badge**: `--text-xs`, pill, `--accent-2-soft` fill for availability and
  new items, `--accent-soft` for warnings.
- **Input, Select, Textarea**: 44px, `--surface-2` fill, `--radius-sm`,
  1px `--border` that becomes `--border-strong` on focus. Labels above,
  helper and error text below.
- **Sheet**: bottom sheet on mobile, right-side panel on desktop, for
  confirmations and secondary flows (ticket terms, sign-in prompt). Built on
  the existing native `<dialog>` approach, portaled, with a drag-to-close
  handle on mobile.
- **StickyBar**: the fixed booking/redeem bar on mobile detail pages. Blur
  backdrop, `--surface` at 92%, safe-area padding, one price and one button.
- **Skeleton**: grey blocks in the exact shape of the content they stand in
  for. Every `loading.tsx` renders the page's skeleton, not a spinner.
- **EmptyState**: icon, one-line title, one-line description, one button.
  No border box.
- **SectionHeader**: title on the left, optional "See all" link on the
  right. The only section header pattern.

## 8. Motion system

All motion goes through `motion/react` and the shared variants file. Rules:

- **Durations**: 150ms for state changes (hover, chip, toggle), 220ms for
  enter/exit of small elements, 300ms for sheets and page cross-fades.
  Nothing above 400ms except video.
- **Easing**: `[0.4, 0, 0.2, 1]` for enters, `[0.4, 0, 1, 1]` for exits.
  Springs (`stiffness 420, damping 30`) only on taps and toggles.
- **Entrance**: `fadeUp` (opacity 0→1, y 12→0) for page sections, with a
  60ms stagger between siblings. Fires once on viewport entry at 15%.
- **Hover**: image scale 1.03 inside a clipped container, card lift 2px.
  Text colour transitions. No shadows appearing on hover.
- **Page transition**: 200ms cross-fade, no vertical movement, so fixed
  bars and sticky elements don't jump.
- **Layout animation**: `layoutId` for the active chip indicator and the
  nav underline; `AnimatePresence` for sheets, menus and toasts.
- **Scroll-linked**: the detail-page hero image may translate up to 8% on
  scroll via `useScroll`. Nothing else is scroll-linked. No scroll snapping,
  no marquees, no continuous loops.
- **Reduced motion**: `MotionConfig reducedMotion="user"` at the root turns
  every transform into an opacity-only change.

## 9. Navigation and shell

References: Airbnb (structure), DICE (mobile).

- **Desktop**: wordmark left; centre rail with Deals, Happenings, Journal,
  Shop (when enabled), About; right side holds the cart and either
  Login / Sign up or an avatar menu with Your deals, Your tickets, Your
  orders, Account, Sign out. Active link underline animates with
  `layoutId`. Background solidifies from transparent to `--surface` after
  40px of scroll.
- **Mobile**: top bar with menu button, wordmark, cart. The menu opens a
  full-height sheet from the right with grouped links (Explore, Your
  account, then Login / Sign up when signed out), 56px tap targets, and the
  active item highlighted in red text.
- **Footer**: four columns on desktop (Explore, Account, Company, Legal),
  stacked on mobile. Wordmark and a one-line description. One `--border`
  line above. No statement copy.
- **Loading**: each route segment renders its own skeleton.

## 10. Page specifications

Each page lists its references, its structure top to bottom, and the motion
it uses. Content in these pages comes from Supabase exactly as today; only
presentation changes unless a new route is listed.

### 10.1 Home, signed out (`/`)

References: Fever and DICE for structure, Airbnb for card rows.

1. **Hero**: video background kept, colour not grayscale, `--scrim-strong`
   at the bottom only. One display headline, one sentence, primary button
   "See deals", ghost button "Sign up". Hero height 70vh desktop, 60vh
   mobile.
2. **Deals this month**: horizontal card row, up to 8 deal cards, "See all"
   link. Hidden when there are no published deals.
3. **Happening next**: horizontal row of event cards with date block,
   venue and price. Hidden when empty.
4. **Who we are**: photo slideshow on the left, short copy and "Our story"
   link on the right. Moves below the fold.
5. **From the Journal**: existing release strip, restyled to the shared card.

Motion: hero copy staggers in once, card rows fade-up on scroll.

### 10.2 Home, signed in (`/`)

References: DICE home tab, Airbnb logged-in state.

1. **Your next event** and **Your active deals**: two compact cards side
   by side, each showing the item and its reference code state. Hidden if
   the user has neither.
2. Then the same discovery rows as the signed-out page, without the hero.

No welcome banner. No swipe carousel.

### 10.3 Deals (`/deals`)

References: Fever, Burpple Beyond, ClassPass.

1. **Page header**: h1 "Deals", one-line description.
2. **Filter bar**: sticky under the nav. Category chips with an "All" chip,
   a location chip when more than one location exists. Active chip
   animates with `layoutId`.
3. **Grid**: uniform 4:3 deal cards, 2 columns mobile, 3 tablet, 4 desktop.
   Card shows cover, vendor name, deal title, member price with original
   price struck through, and an availability badge ("6 left this month",
   teal) or "Fully claimed" (muted).
4. Sections grouped by category remain, each with a `SectionHeader`.

Motion: chips animate, cards fade-up in a 40ms stagger.

### 10.4 Deal detail (`/deals/[id]`) — new route

Reference: Airbnb listing page.

1. **Media**: cover image at 16:9, full container width.
2. **Two columns on desktop**: left has vendor, title, locations, category,
   description, "What you get", terms accordion, and "More from this
   vendor" row. Right has a sticky redeem card: member price, original
   price, availability badge, primary "Redeem" button.
3. **Mobile**: single column with a `StickyBar` holding price and Redeem.
4. **Redeem flow**: tapping Redeem opens a `Sheet` with the terms summary,
   the agreement checkbox and the final "Confirm and pay" button. The
   sign-in prompt uses the same sheet for signed-out users.

Motion: hero parallax up to 8%, sticky card fades in after the hero scrolls
past, sheet springs up.

### 10.5 Happenings (`/happenings`)

References: DICE, Resident Advisor.

1. **Featured**: the next event as a hero with cover in colour, date block,
   title, venue, price, and a primary "Get tickets" button linking to the
   detail page. Height 60vh.
2. **Upcoming list**: vertical list grouped by "This week", "This month",
   "Later". Each row: 3:4 poster thumbnail, date block (day number, month,
   weekday), title, venue, price or "Free". Rows link to the detail page.
3. **Past events**: 3-column poster grid, muted, no hover lift.

Motion: featured copy staggers, list rows fade-up, date blocks static.

### 10.6 Event detail (`/happenings/[id]`) — new route

Reference: DICE event page.

Same skeleton as the deal detail: media, two columns, sticky ticket card
(price per person, capacity remaining as a teal badge, quantity stepper,
"Get tickets"), `StickyBar` on mobile, terms and sign-in in a `Sheet`.
Below: description, organiser, venue with map link when a location exists,
and "More dates" as a row of event cards.

### 10.7 Journal (`/journal`)

References: Resident Advisor news, Bandcamp Daily.

1. **Header** and a chip row: All, Releases, News, Happenings, Shop.
2. **Lead item**: the most recent entry as a wide card with a large
   thumbnail.
3. **Grid**: two columns desktop, one mobile. Release cards keep the inline
   YouTube play. Event and product entries link to their detail pages.

### 10.8 Account (`/account`, `/account/tickets`, `/account/deals`, `/account/orders`)

References: DICE ticket wallet, Apple Wallet passes.

- **Account**: identity row, then a plain list of links, then Sign out.
- **Tickets and deals**: each item as a pass. Cover strip, event or vendor
  name, date or location, then a large reference code in `--font-display`
  with a teal "Paid" or "Checked in" badge, or a red "Payment pending" badge
  with a "Complete payment" button. Denied and reversed states shown as a
  timeline under the code.
- **Orders**: order card with items, total, and a horizontal progress
  stepper for fulfilment.

### 10.9 Auth (`/login`, `/signup`)

Reference: Airbnb login.

Single centred card on `--surface`, Google button first, "or" divider,
email and password, inline errors, one primary button. The card fades up
once. No changes to the auth logic.

### 10.10 About (`/about`)

Short hero image, mission copy at 65ch, three principles as plain rows, two
link cards to Deals and Happenings using the shared Card.

### 10.11 Shop, product, cart

References: SSENSE, Stüssy. Lower priority while Shop is hidden. Product
cards use the shared Card at 1:1, product detail uses the detail-page
skeleton with the gallery in place of a single cover, cart is a two-column
summary on desktop and stacked on mobile with a `StickyBar` for checkout.

## 11. Routing

New canonical routes, with permanent redirects from the old ones so nothing
already shared breaks:

| Old | New |
|---|---|
| `/studio` | `/happenings` |
| `/studio/deals` | `/deals` |
| (none) | `/happenings/[id]` |
| (none) | `/deals/[id]` |

Nav items, footer links, the admin "hide from nav" keys and `next` redirect
params all move to the new paths in the same change.

## 12. Order of work

Each step is one pull request and leaves the site fully working.

1. **Foundations**: tokens (this document's palette and type scale),
   shared components, motion variants, skeletons, `next/image` migration
   helper. Remove the splash screen, grain, marquee and loader.
2. **Shell**: desktop nav, mobile sheet, footer, page transition.
3. **Deals** list and the new deal detail route, with redirects.
4. **Happenings** list and the new event detail route, with redirects.
5. **Home**, both states.
6. **Journal**, **Account**, **Auth**, **About**.
7. **Shop**, product and cart, when the section is switched back on.

## 13. Content requirements

The UI cannot look finished on placeholder data. Before or alongside step 3:

- A cover photo for every published deal and event, in colour, at least
  1600px on the long edge.
- Real vendor names and logos for deals.
- Product photography that is not AI-generated.
- Four to six slideshow photos of real Tyco events for the "Who we are"
  section.
