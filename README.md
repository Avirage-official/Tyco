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

## App structure

- `/` — landing page, links into the three pillars below.
- `/music` — the free streaming catalogue: browse by artist, genre, album,
  or the full track list; shuffle everything; or jump into
  `/music/artists/[id]`, `/music/albums/[id]`, and `/music/genres/[genre]`.
  A real player: seek/scrub, skip, shuffle, repeat (off/all/one), an inline
  "Up Next" queue, lock-screen/notification controls via the Media Session
  API, and Liked Songs (`/music/liked`) for signed-in listeners. Tap the
  mini player to expand to a full-screen Now Playing view. Artist pages are
  full pages (not a modal) — they stack more sensibly with the full-screen
  player, get shareable URLs, and give room for a real profile: bio,
  albums, singles, and an optional short muted looping video in place of
  the static photo.
- `/studio` and `/studio/events` — creative/portfolio updates and events
  (past + upcoming), tabbed together under "Studio".
- `/shop` and `/shop/[id]` — retail product grid and product detail, with
  per-size stock (sold-out sizes show as struck through). Cart and checkout
  are **not** built yet — "Add to cart" is a stub.
- `/login`, `/signup`, `/account` — Supabase email/password auth. A
  `profiles` row is created automatically on signup via a DB trigger.
- `/admin` — content, orders, and user management (see "Admin panel" below).
  Only visible/reachable if your account is in `public.admins`; everyone
  else gets redirected before rendering anything.

Anything published in the last two weeks shows an automatic "New" tag on
`/music`, `/shop`, and `/studio` — no manual step, it's driven off
`published_at`.

Mobile gets a bottom tab bar (Home / Music / Studio / Shop / Account) so the
site behaves like an installed app; desktop gets a top nav instead. The
`manifest.webmanifest` + icons make "Add to Home Screen" produce a real app
icon and standalone window.

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
  order time and reference a specific `product_variants` row). Customers can
  only `SELECT`/`INSERT` their own orders — status transitions
  (`pending → paid → fulfilled → ...`) are service-role/webhook-only, so a
  signed-in customer can't mark their own order paid from the browser.
- **`track_likes`** — a listener's saved tracks (`user_id`, `track_id`).
  Purely self-service: RLS restricts every operation to `auth.uid() = user_id`,
  verified against a local Postgres instance that one user's likes are
  invisible to and un-deletable by another.

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

- Shopping cart + checkout — `orders`/`order_items` and a `stripe_payment_intent_id`
  column are already there, and the admin Orders screen can already manage
  whatever checkout produces. Stripe is the obvious fit.
- The player state (queue, position, shuffle) doesn't persist across a full
  page reload — resets are only mid-session. Worth a localStorage restore
  if that starts to bother listeners.
- The admin panel doesn't paginate long lists yet — fine at foundation
  scale, worth revisiting once there are hundreds of tracks/products.
- Play counts increment on every track start, not after a minimum listen
  duration — fine for now, revisit if you want counts closer to how
  Spotify/Apple define a "play."
