# Tyco

The studio journal (creative work + events) and the retail shop — one web
app, styled to feel like an app on your phone. Built with Next.js, deployed
on Vercel, backed by Supabase.

## Stack

- **Next.js 16** (App Router, TypeScript) — note the `src/proxy.ts` file:
  Next 16 renamed `middleware.ts` to `proxy.ts`, this is not a typo.
- **Hand-written CSS** (CSS Modules + a token system in `src/app/globals.css`)
  — no Tailwind, no component library. Colors, type, spacing all live as
  CSS custom properties so the look stays consistent and easy to retune.
- **Supabase** — Postgres + Auth + Storage. Schema lives in `supabase/schema.sql`.
- **Vercel** for hosting.

## Design system

- **Palette**: warm black (`--ink`), deep/bright red (`--red*`), cream white
  (`--paper*`). Tokens are in `src/app/globals.css`. Black is the fixed
  background — deliberately no `prefers-color-scheme` override, so the look
  doesn't change based on the visitor's system theme.
- **Type**: Inter, one family for both display and body, loaded once in
  `layout.tsx` and set on the shared `--font-display`/`--font-body` tokens
  in `globals.css` — every component reads through those two tokens rather
  than naming a font directly, so this was a two-file change even though it
  touches every page. Deliberately not the original Fraunces/Work Sans
  pairing — moved to a cleaner, more neutral retail-catalog feel.
- **Icons**: a small hand-built SVG set in `src/components/icons.tsx`, not a
  library import — every mark carries a small red dot as a recurring motif.
- App icon / favicon / manifest icons are generated in code with `next/og`
  (`src/app/icon.tsx`, `apple-icon.tsx`, `web-icon-192/512`), no image
  assets to keep in sync.
- **Crest logo** (`src/components/brand/CrestLogo.tsx`) — the crown/shield/T
  mark, hand-built as SVG (ring text on `<textPath>` arcs computed from a
  small polar-coordinate helper in `src/lib/geometry.ts`, not traced from a
  raster image). Takes a `playing` prop that turns on a staggered draw-in
  animation (ring → crown → shield halves → the T → ring text → dots);
  without it, the mark just renders in its final state. Swap in a real
  vector export later by replacing the path data — the animation choreography
  and component API stay the same.
- **Splash screen** (`src/components/brand/SplashScreen.tsx`) — plays the
  full animated crest once per browser session (gated on `sessionStorage`,
  not `localStorage`, so it replays on a fresh session but not on every
  internal navigation), then fades out. Mounted once in the root layout.
- **Loading states**: a small shared `Loader`/`PageLoader`
  (`src/components/ui/Loader.tsx`) — an orbiting-arc mark in the brand's
  red, not a generic spinner import — wired into a `loading.tsx` in every
  top-level route segment (`/`, `/studio`, `/shop`, `/admin`,
  `/account`, `/login`+`/signup`), so any nested route that doesn't define
  its own loading state inherits one automatically.
- **Page transitions**: `PageTransition` (`src/components/app-shell/`)
  re-keys its children by pathname so every route change replays a short
  fade/rise-in — no animation library, just a CSS keyframe retriggered by
  a React remount. Wired once into `AppShell`, so new pages get it for free.
- **Micro-interactions**: a shared `.lift` utility class in `globals.css`
  plus hover/active rules baked directly into the shared card styles
  (product cards, the home page's pillar cards) — a small rise on hover, a
  settle on tap. Everything motion-related respects `prefers-reduced-motion`.

## App structure

- `/` — branches on auth state. Both states share `VideoHero`
  (`components/home/VideoHero.tsx`), a full-bleed looping background video
  (autoplays muted/looped, hidden entirely under `prefers-reduced-motion:
  reduce`) — drop the clip at `public/video/home-hero.mp4`. **Signed out**:
  a minimal landing page — the hero statement over the video, a live
  "what's next" spotlight (soonest upcoming published event, hidden
  entirely when there isn't one), sign in/sign up/about-us buttons, and a
  quiet Studio/Shop link row, then a static image-backed "who we are"
  section (a condensed version of the `/about` copy with a link to the full
  story — drop the photo at `public/images/about-section.jpg`), then the
  "who we are" slideshow of photos and short clips (hidden entirely when
  none are set, managed from `/admin/settings`). **Signed in**: a personal
  dashboard under its own compact `VideoHero` banner — a scrolling data
  ticker built from your own live stats, a duotone 35mm contact-strip of
  recent cover art (from published portfolio items) scrolling like film
  through a projector, the next event as a perforated ticket stub, a
  mission-fund progress bar rendered as a pulsing VU/equalizer meter, the
  same "who we are" slideshow as the front page, and an order-history
  shortcut as a die-cut backstage-pass tag. The project teaser and mission
  fund are editable from `/admin/settings` and hidden when empty; the
  ticker, film strip, and slideshow hide themselves too when there's
  nothing to show. Every animation loop respects `prefers-reduced-motion`.
  The installed PWA's `start_url` points back at `/`, since it now routes
  every visitor to the right place on its own.
- `/about` — the company story: who TYCO is, what the collective does, and
  the same two-pillar explore cards as before, under the same `VideoHero`
  treatment (a shorter variant) as the front page. Static copy, no
  database reads — reachable from the top nav, the footer, and the "About
  us" button on the front page.
- `/creators` — the public directory of published creators (avatar, type,
  name, tagline), each linking to their `/creators/[slug]` page. That page
  is a Lenis-smooth-scrolled sequence of full-bleed "chapters" — a banner
  hero, bio and gallery, then `creator_works` entries. A work whose
  `external_url` is a specific Instagram post/reel or TikTok video renders
  a real inline embed (`PostEmbed.tsx`, each platform's official
  `embed.js`) instead of a plain "View" link — profile-level
  `instagram_url`/`tiktok_url` stay as simple chips, since neither platform
  supports embedding a whole profile feed, only individual posts. A
  musician's `youtube_url` gets its own embedded section, and
  `spotify_url` a floating corner player mounted only on that creator's
  page. Published products tied to the creator (`products.creator_id`)
  close the page out as a shop grid.
- `/studio` and `/studio/events` — a Creators teaser (published creator
  profiles, linking into their full `/creators/[slug]` pages) and events,
  tabbed together under "Studio". Events split into an **Upcoming** list
  (soonest first) and a **Past events** cover-art grid (most recent first)
  so visitors can see what's already happened, not just what's next —
  either section is omitted when it's empty. Upcoming events sell tickets:
  pick a pax count, pay through the same Revolut flow as the shop (skipped
  entirely for free events), and the ticket shows up in `/account/tickets`
  with a short reference code and a pax badge — that's what the buyer shows
  at the door. Buying a ticket requires being signed in, unlike shop
  checkout, since the whole point is that it's tied to an account staff can
  check in. Capacity (if the event has one) is tracked the same way shop
  stock is: decremented only once payment actually clears, not at checkout.
- `/shop` and `/shop/[id]` — retail product grid and product detail, with
  per-size stock (sold-out sizes show as struck through) and up to 5 photos
  per product in a thumbnail-driven gallery (`Gallery.tsx` — a vertical
  thumbnail rail alongside the main image on desktop, a horizontal row above
  it on mobile; click a thumbnail or use the arrows, no autoplay and no
  carousel library). A breadcrumb (Home / Shop / category / product) sits
  above the gallery, and the description lives in a collapsed "Product
  details" accordion (`components/ui/Accordion.tsx`). Pick a size and
  quantity, add to cart.
- `/cart` — client-side cart (React context + localStorage) — nothing
  touches the database until checkout. Works for guests; no account
  required. Checkout re-validates every price
  and stock level server-side (never trusts the cart's own numbers), writes
  a `pending` order, and redirects to a Revolut-hosted checkout page.
  `/checkout/confirmation` is where the customer lands afterward; the
  webhook at `/api/webhooks/revolut` is the actual source of truth for
  "did this get paid" — it verifies Revolut's signature, flips the order to
  `paid`, and decrements stock atomically (clamped at zero, so a retried
  webhook delivery can never oversell). See "Payments (Revolut)" below for
  setup.
- `/login`, `/signup`, `/account` — Supabase email/password auth. A
  `profiles` row is created automatically on signup via a DB trigger.
  `/account/orders` lists a signed-in customer's own past orders (status,
  items, totals) — reads through the normal RLS-scoped client, no special
  access needed since customers can already `SELECT` their own orders.
- `/admin` — content, orders, and user management (see "Admin panel" below).
  Only visible/reachable if your account is in `public.admins`; everyone
  else gets redirected before rendering anything.

Anything published in the last two weeks shows an automatic "New" tag on
`/shop` and `/studio` — no manual step, it's driven off `published_at`.

Mobile gets a bottom tab bar (Home / Studio / Shop / Account) so the
site behaves like an installed app; desktop gets a top nav instead, which
checks auth server-side and shows a "Sign out" link next to the cart when
you're signed in (`TopNav` is a server component; `NavLinks` and
`TopNavSignOut` are the client-side pieces inside it). The
`manifest.webmanifest` + icons make "Add to Home Screen" produce a real app
icon and standalone window. A site-wide footer sits under every page's
content with the wordmark, tagline, and a second set of links (Creators,
Studio, Shop, About, Account, Terms & Conditions).

## Admin panel

`/admin` is a real content-management UI, gated by `public.admins` +
Supabase auth (not a separate hardcoded login) — see "Local setup" below for
how to grant yourself access.

- **Portfolio, Events, Products** — list, create, edit, publish/unpublish,
  delete. Cover art / gallery images upload straight from the browser to
  Supabase Storage (bypassing the Next.js server, so there's no file-size
  limit from Vercel's function body cap). Products manage their per-size
  stock (`product_variants`) inline on the same form; Events set a ticket
  price (0 for free) and an optional capacity in the same form.
- **Check-in** (`/admin/checkin`) — type a ticket's reference code, see the
  event, pax count, and payment status, then check it in. A ticket can only
  be checked in once — the underlying `check_in_ticket()` function raises
  rather than silently overwriting if it's already used, so re-scanning a
  used code surfaces as an error instead of letting someone back in twice.
  Also linked from the Events list.
- **Orders** — every order, who placed it, how many items, total, and a
  status dropdown (`pending → paid → fulfilled → …`). This is the only
  place order status changes — customers can never do this themselves.
- **Homepage** (`/admin/settings`) — edits the one `site_settings` row:
  the front-page slideshow (up to 8 photos/clips, upload straight from the
  browser, reorder with the arrows — empty just hides the slideshow), the
  "coming next" project teaser (title, description, image — blank title
  hides the card), and the mission ("What we're funding" — a short editorial
  line shown as an animated strip beside the next event, blank hides it —
  plus raised/goal in USD, kept for the record but not shown on the
  homepage). The teaser and mission strip render on the signed-in dashboard
  at `/`; the slideshow renders on the signed-out landing page.
- **Users** — every signed-up account, block/unblock, delete. Uses the
  Supabase **Admin API**, which needs the service-role key
  (`SUPABASE_SERVICE_ROLE_KEY`) — the only part of the app that does. You
  can't block or delete your own account from this screen (guards against
  locking yourself out).
- **Debug** (`/admin/debug`) — a scoped-down error log, not a general one:
  just the two failure modes that can happen silently from a customer's
  point of view — a paid order that never reached Merchize, or a Merchize
  status update that couldn't be matched to an order (`webhook_errors`
  table, written only by the two webhook routes via the service-role
  client). Everything else still only shows up in Vercel's function logs.

Every admin write re-checks `is_admin()` on the server on every request —
nothing is trusted just because a page rendered the admin UI once.

**Supabase free tier caps individual files at 50MB.** Portfolio and event
cover images are well under that; no need to upgrade Supabase for this
alone.

## Payments (Revolut)

Checkout uses Revolut's Merchant API (Orders + Hosted Checkout Page), not a
client-side widget — the server creates the order, the customer pays on a
Revolut-hosted page, and a webhook is what actually confirms payment.

1. **Get sandbox keys**: Revolut Business dashboard → Merchant account →
   Developer → API keys. Start with sandbox, not live.
2. **Set env vars** (see `.env.example`): `REVOLUT_API_BASE_URL`,
   `REVOLUT_SECRET_KEY`.
3. **Register the webhook**: Revolut's Business dashboard has no webhook UI
   on this account — it's registered via their API instead. Visit
   `/admin/webhooks` (signed in as an admin) and submit your production
   webhook URL (`https://<your-domain>/api/webhooks/revolut`); it registers
   for `ORDER_COMPLETED`, `ORDER_AUTHORISED`, `ORDER_CANCELLED`,
   `ORDER_PAYMENT_DECLINED`, `ORDER_PAYMENT_FAILED` and shows the signing
   secret to copy into `REVOLUT_WEBHOOK_SIGNING_SECRET`. Re-submitting the
   same URL later just re-shows the secret rather than creating a duplicate
   (Revolut caps accounts at 10 webhooks total).
4. **Test a full checkout** in sandbox (test card numbers are in Revolut's
   docs under Testing) before switching `REVOLUT_API_BASE_URL` and the two
   secrets to their live equivalents.

Order matching is done via `merchant_order_ext_ref`, which is always our own
`orders.id` — the webhook trusts that field, not any Revolut-side order id,
so it doesn't depend on exactly which field name a given API version uses
for its own identifier.

**Honest caveat**: this was built against Revolut's documented API shape
researched separately (this dev environment can't reach
`developer.revolut.com` to double-check field names directly), and it's
never been exercised against a real Revolut sandbox request. The pinned
`Revolut-Api-Version` in `src/lib/checkout/revolut.ts` and the webhook
payload field-paths it reads are the two things most likely to need a small
correction once you run a real test — check the Vercel function logs for
`/api/webhooks/revolut` on the first live attempt.

## Fulfilment (Merchize)

Checkout now collects a shipping address (cart → shipping fields →
`orders.shipping_address`), so once Revolut confirms payment,
`/api/webhooks/revolut` also submits the order to Merchize, a print-on-
demand/dropship partner, via `src/lib/checkout/merchize.ts`. Merchize's own
webhook then reports fulfilment status and tracking back.

1. **Get your store's API base URL + access token**: Merchize dashboard →
   API page. The base URL is specific to your store, not a shared constant.
2. **Set env vars** (see `.env.example`): `MERCHIZE_API_BASE_URL`,
   `MERCHIZE_ACCESS_TOKEN`, `MERCHIZE_MODE`.
3. **Register the webhook**: same dashboard → Webhooks → add
   `https://<your-domain>/api/webhooks/merchize`, select the order-lifecycle
   events (created, changed progress/shipment/tracking, invalid address,
   importer error, issue updated — the payment/fee ones aren't used here),
   then copy the value they send in the `merchize-webhook-key` header into
   `MERCHIZE_WEBHOOK_KEY`.
4. **Set each product variant's Merchize code**: `/admin/products` → edit a
   product → each size row has a "Merchize code" field — the exact
   variant/SKU code from your Merchize product catalog. An order containing
   a variant with no code set will fail the Merchize submission (logged in
   Vercel's function logs, not silently dropped — the order still shows as
   paid, it just needs a manual push once the code is added).
5. **Test a full checkout** once both webhooks and at least one product's
   variant codes are set up.

`orders.status` only ever advances to `fulfilled` once Merchize's webhook
actually reports a shipment — everything in between (submitted, in
production, etc.) lives in the separate `merchize_status` column, visible
per-order in `/admin/orders`, so the existing pending → paid → fulfilled →
… status dropdown and any logic built on it doesn't need to change.

**Honest caveat**: same situation as Revolut above — Merchize's docs (as
available when this was built) cover the `merchize-webhook-key` header and
retry rules (5 attempts/day over 3 days, expects HTTP 200) clearly, but not
the exact order-creation request schema or webhook payload shape. The field
names in `src/lib/checkout/merchize.ts` and the payload field-lookups in
`src/app/api/webhooks/merchize/route.ts` are a best-effort reconstruction,
not a confirmed spec — place one real order and check Vercel's function logs
for both routes; a rejected order or an unmatched webhook event is almost
certainly a field name needing a small correction, not the surrounding logic.

## Local setup

1. Install dependencies:

   ```bash
   npm install
   ```

2. Create a Supabase project, then copy `.env.example` to `.env.local` and
   fill in the values from **Project Settings → API** — including the
   `service_role` secret (`SUPABASE_SERVICE_ROLE_KEY`), needed for the admin
   panel's user management. It's server-only; never exposed to the browser:

   ```bash
   cp .env.example .env.local
   ```

3. Apply the schema: open the Supabase SQL editor and run the contents of
   `supabase/schema.sql`. It's idempotent — safe to re-run any time the file
   changes, including on a project that already has an older version applied.
   It creates every table, RLS policy, trigger, and the storage buckets
   (`covers`, `portfolio`, `products`, `about`).

4. Grant yourself admin so you can reach `/admin` — sign up in the app first
   (so a `profiles`/`auth.users` row exists), then in the SQL editor:

   ```sql
   insert into public.admins (user_id)
   select id from auth.users where email = 'you@example.com';
   ```

   That's it — sign in and go to `/admin` (there's a link on `/account` too).
   No separate admin login to configure.

5. Run the dev server:

   ```bash
   npm run dev
   ```

   Open [http://localhost:3000](http://localhost:3000).

## Data model

`supabase/schema.sql` is the source of truth; the short version:

- **`admins`** — allow-list of user IDs that can write content. Deliberately
  has no client-facing policies at all (not even for admins themselves) —
  only the service role can grant/revoke it, so it can't be self-escalated
  into from a signed-in session the way a flag on `profiles` could be.
- **`portfolio_items`**, **`events`** — creative updates and past/upcoming
  events; "past" vs "upcoming" is derived from `event_date` at query time.
  `events.price_cents`/`capacity` are admin-set; `capacity_remaining` is a
  live decrementing counter, same relationship as `products.stock`.
- **`event_tickets`** — one row per *purchase*, not per attendee (a single
  ticket row covers however many pax were bought together). Requires a
  signed-in buyer — unlike shop orders, a ticket only means something tied
  to an account, since that's how the buyer proves it at the door and how
  staff find it to check them in. `reference_code` is the short code shown
  on the ticket and looked up in `/admin/checkin`; `checked_in_at`/`_by` are
  only ever set through the `check_in_ticket()` function (admin-only,
  refuses an already-checked-in ticket). `decrement_event_capacity()`
  mirrors `decrement_variant_stock()` — same webhook-only, payment-confirmed
  timing.
- **`products`** → **`product_variants`** (one row per size, its own stock —
  so "Medium is sold out, Large isn't" is representable).
- **`orders`** → **`order_items`** (line items pin `unit_price_cents` at
  order time and reference a specific `product_variants` row). A signed-in
  customer's own RLS policies only allow `SELECT`/`INSERT` on their own
  orders — but checkout also needs to work for guests (no session to satisfy
  `auth.uid() = user_id`), so the checkout server action writes through the
  service-role client instead, after re-validating price and stock itself —
  it still reads the caller's session separately to attach `user_id` when
  they're signed in, so the order shows up in their `/account/orders` later.
  Status transitions (`pending → paid → fulfilled → ...`) are always
  service-role/webhook-only — no path lets a customer mark their own order
  paid from the browser. `orders.revolut_order_id` and the
  `decrement_variant_stock()` RPC (atomic, clamped at zero) exist
  specifically for the webhook handler.
- **`site_settings`** — a singleton row (`id` is always `true`, enforced by
  a check constraint) holding the homepage's editable bits: the "coming
  next" project teaser, the mission blurb + raised/goal amounts, and
  `about_gallery` (an ordered jsonb array of `{url, type}`, `type` being
  `"image"` or `"video"`) for the front-page slideshow. Publicly readable,
  admin-writable, same as everything else — edited from `/admin/settings`.
- **`webhook_errors`** — a small log for the two integration failure modes
  worth an admin's attention (see "Admin panel" above). No client-facing
  policies beyond an admin-only `select`; only the service-role client
  (used by the webhook routes) can insert.

Every publishable table has `is_published` + `published_at` (auto-stamped by
a trigger the first time a row is published) and `updated_at` (auto-bumped
on every update).

## Deploying

1. Push this repo to GitHub (already done if you're reading this on the repo).
2. Import the repo in Vercel.
3. Add the two env vars from `.env.example` in the Vercel project settings.
4. Deploy — Vercel auto-detects Next.js, no extra config needed.

## What's next

This pass is the foundation: design system, navigation shell, auth, and a
real (if empty) Supabase-backed schema for the remaining verticals. Natural
next steps, roughly in order:

- Cart + checkout are built (Revolut) but never exercised against a real
  Revolut sandbox request from this environment — see "Payments (Revolut)"
  for the one real test that still needs doing.
- The cart is per-device (localStorage) — a customer switching phones or
  browsers starts a fresh cart. Fine for now; would need a `cart_items`
  table tied to a signed-in account to change.
- The admin panel doesn't paginate long lists yet — fine at foundation
  scale, worth revisiting once there are hundreds of products.
