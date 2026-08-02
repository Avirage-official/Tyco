# Tyco

Free music, the studio journal (creative work + events), and the retail shop —
one web app, styled to feel like an app on your phone. Built with Next.js,
deployed on Vercel, backed by Supabase.

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
- **Type**: Fraunces (display/serif, warm and a little wonky at large sizes)
  paired with Work Sans (body). Deliberately not Inter/Geist/Space
  Grotesk — those read as generic "AI app" defaults.
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
  top-level route segment (`/`, `/music`, `/studio`, `/shop`, `/admin`,
  `/account`, `/login`+`/signup`), so any nested route that doesn't define
  its own loading state inherits one automatically.
- **Page transitions**: `PageTransition` (`src/components/app-shell/`)
  re-keys its children by pathname so every route change replays a short
  fade/rise-in — no animation library, just a CSS keyframe retriggered by
  a React remount. Wired once into `AppShell`, so new pages get it for free.
- **Micro-interactions**: a shared `.lift` utility class in `globals.css`
  plus hover/active rules baked directly into the shared card styles
  (album/artist/playlist/library cards, product cards, the home page's
  pillar cards) — a small rise on hover, a settle on tap. Everything
  motion-related respects `prefers-reduced-motion`.

## App structure

- `/` — landing page: mission narrative (the manifesto behind the three
  pillars) plus a live "what's next" spotlight — the soonest upcoming
  published event if there is one, otherwise the latest published album —
  pulled straight from Supabase, hidden entirely when neither exists. Links
  into the three pillars below. The installed PWA's `start_url` points at
  `/music` instead of here, so opening it from a home screen goes straight
  to the catalogue rather than replaying the pitch every launch.
- `/music` — the free streaming catalogue, split into two tabs. **Browse**:
  an instant client-side search bar (artists, albums, tracks, genres — no
  extra request, it filters what's already loaded) sitting above the usual
  browse-by-artist/genre/album/full-track-list view; shuffle everything, or
  jump into `/music/artists/[id]`, `/music/albums/[id]`, and
  `/music/genres/[genre]`. **Library** (`/music/library`, signed-in only):
  Liked Songs, your playlists, and the artists you follow, all in one place.
  A real player: seek/scrub, skip, shuffle, repeat (off/all/one), an inline
  "Up Next" queue, lock-screen/notification controls via the Media Session
  API, and Liked Songs (`/music/liked`) for signed-in listeners. Tap the
  mini player to expand to a full-screen Now Playing view. Artist pages are
  full pages (not a modal) — they stack more sensibly with the full-screen
  player, get shareable URLs, and give room for a real profile: bio,
  albums, singles, a Follow button, and an optional short muted looping
  video in place of the static photo.
- **Playlists** — create, rename, and delete your own playlists
  (`/music/playlists/[id]`); add any track to one or more playlists from the
  `+` button next to it in any track list, or pull it back out from inside
  the playlist itself. All owner-scoped through RLS — no server code
  involved, the browser talks to Supabase directly and the database enforces
  who can see and change what.
- `/studio` and `/studio/events` — creative/portfolio updates and events
  (past + upcoming), tabbed together under "Studio".
- `/shop` and `/shop/[id]` — retail product grid and product detail, with
  per-size stock (sold-out sizes show as struck through) and up to 5 photos
  per product in a swipeable gallery (`Gallery.tsx` — hand-rolled scroll-snap
  + dots + arrows, no carousel library). Pick a size and quantity, add to
  cart.
- `/cart` — client-side cart (React context + localStorage, same pattern as
  the music player's queue) — nothing touches the database until checkout.
  Works for guests; no account required. Checkout re-validates every price
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
`/music`, `/shop`, and `/studio` — no manual step, it's driven off
`published_at`.

Mobile gets a bottom tab bar (Home / Music / Studio / Shop / Account) so the
site behaves like an installed app; desktop gets a top nav instead. The
`manifest.webmanifest` + icons make "Add to Home Screen" produce a real app
icon and standalone window. A site-wide footer sits under every page's
content with the wordmark, tagline, and a second set of links to the four
sections.

## Admin panel

`/admin` is a real content-management UI, gated by `public.admins` +
Supabase auth (not a separate hardcoded login) — see "Local setup" below for
how to grant yourself access.

- **Artists, Albums, Tracks, Portfolio, Events, Products** — list, create,
  edit, publish/unpublish, delete. Cover art / audio / gallery images
  upload straight from the browser to Supabase Storage (bypassing the
  Next.js server, so there's no file-size limit from Vercel's function
  body cap). Products manage their per-size stock (`product_variants`)
  inline on the same form.
- **Bulk track upload** — from an album's row in `/admin/albums`, "Add
  tracks" lets you select every audio file for that album at once. Title
  and track number are guessed from each filename (editable before
  submitting), duration is read from the file automatically, and
  artist/cover/release date are inherited from the album. Singles still go
  through the regular "New track" form one at a time.
- **Orders** — every order, who placed it, how many items, total, and a
  status dropdown (`pending → paid → fulfilled → …`). This is the only
  place order status changes — customers can never do this themselves.
- **Users** — every signed-up account, block/unblock, delete. Uses the
  Supabase **Admin API**, which needs the service-role key
  (`SUPABASE_SERVICE_ROLE_KEY`) — the only part of the app that does. You
  can't block or delete your own account from this screen (guards against
  locking yourself out).

Every admin write re-checks `is_admin()` on the server on every request —
nothing is trusted just because a page rendered the admin UI once.

**Supabase free tier caps individual files at 50MB.** Uploads go per track,
not per album, so a normal 3–5 min WAV song is usually fine — only very
long or very high-res tracks risk hitting it. If one does, compress just
that track (MP3/FLAC); no need to upgrade Supabase for this alone. Video is
the one place this is worth watching more closely — keep an artist's
profile loop short (5–15s) and compressed; it's a much bigger file than a
photo for the same number of seconds.

## Payments (Revolut)

Checkout uses Revolut's Merchant API (Orders + Hosted Checkout Page), not a
client-side widget — the server creates the order, the customer pays on a
Revolut-hosted page, and a webhook is what actually confirms payment.

1. **Get sandbox keys**: Revolut Business dashboard → Merchant account →
   Developer → API keys. Start with sandbox, not live.
2. **Set env vars** (see `.env.example`): `REVOLUT_API_BASE_URL`,
   `REVOLUT_SECRET_KEY`.
3. **Register the webhook**: same dashboard → Webhooks → add
   `https://<your-domain>/api/webhooks/revolut`, subscribe to
   `ORDER_COMPLETED`, `ORDER_AUTHORISED`, `ORDER_CANCELLED`,
   `ORDER_PAYMENT_DECLINED`, `ORDER_PAYMENT_FAILED`, then copy the signing
   secret into `REVOLUT_WEBHOOK_SIGNING_SECRET`.
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
   (`tracks`, `covers`, `portfolio`, `products`, `artists`).

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
- **`artists`** → **`albums`** → **`tracks`** (`artist_id` on both albums and
  tracks; `album_id` on tracks is nullable — singles don't need one).
  `tracks.genre` is free text, not an enum — the music page derives its
  browsable genre list from whatever values are actually in use.
- **`portfolio_items`**, **`events`** — creative updates and past/upcoming
  events; "past" vs "upcoming" is derived from `event_date` at query time.
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
- **`track_likes`** — a listener's saved tracks (`user_id`, `track_id`).
  Purely self-service: RLS restricts every operation to `auth.uid() = user_id`,
  verified against a local Postgres instance that one user's likes are
  invisible to and un-deletable by another.
- **`artist_follows`** — same shape and same RLS pattern as `track_likes`,
  for artists instead of tracks.
- **`playlists`** → **`playlist_tracks`** — a listener's own playlists.
  `playlists` is scoped `auth.uid() = user_id`; `playlist_tracks` has no
  `user_id` of its own, so its policy checks ownership via an `exists`
  join to the parent playlist. No admin policy on either — nobody manages
  another listener's playlists, including admins.

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
real (if empty) Supabase-backed schema for all three verticals. Natural
next steps, roughly in order:

- Cart + checkout are built (Revolut) but never exercised against a real
  Revolut sandbox request from this environment — see "Payments (Revolut)"
  for the one real test that still needs doing.
- The cart is per-device (localStorage) — a customer switching phones or
  browsers starts a fresh cart. Fine for now; would need a `cart_items`
  table tied to a signed-in account to change.
- The player state (queue, position, shuffle) doesn't persist across a full
  page reload — resets are only mid-session. Worth a localStorage restore
  if that starts to bother listeners.
- The admin panel doesn't paginate long lists yet — fine at foundation
  scale, worth revisiting once there are hundreds of tracks/products.
- Play counts increment on every track start, not after a minimum listen
  duration — fine for now, revisit if you want counts closer to how
  Spotify/Apple define a "play."
