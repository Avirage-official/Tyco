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
  (`--paper*`). Tokens are in `src/app/globals.css`; dark mode remaps the
  same tokens rather than introducing new ones.
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
- `/music` — the free streaming catalogue. Has a working (basic) player:
  tap play on a track and a now-playing bar docks above the bottom nav.
- `/studio` and `/studio/events` — creative/portfolio updates and events
  (past + upcoming), tabbed together under "Studio".
- `/shop` and `/shop/[id]` — retail product grid and product detail, with
  per-size stock (sold-out sizes show as struck through). Cart and checkout
  are **not** built yet — "Add to cart" is a stub.
- `/login`, `/signup`, `/account` — Supabase email/password auth. A
  `profiles` row is created automatically on signup via a DB trigger.

Mobile gets a bottom tab bar (Home / Music / Studio / Shop / Account) so the
site behaves like an installed app; desktop gets a top nav instead. The
`manifest.webmanifest` + icons make "Add to Home Screen" produce a real app
icon and standalone window.

## Local setup

1. Install dependencies:

   ```bash
   npm install
   ```

2. Create a Supabase project, then copy `.env.example` to `.env.local` and
   fill in the values from **Project Settings → API**:

   ```bash
   cp .env.example .env.local
   ```

3. Apply the schema: open the Supabase SQL editor and run the contents of
   `supabase/schema.sql`. It's idempotent — safe to re-run any time the file
   changes, including on a project that already has an older version applied.
   It creates every table, RLS policy, trigger, and the storage buckets
   (`tracks`, `covers`, `portfolio`, `products`).

4. Grant yourself admin so you can publish content — sign up in the app
   first (so a `profiles`/`auth.users` row exists), then in the SQL editor:

   ```sql
   insert into public.admins (user_id)
   select id from auth.users where email = 'you@example.com';
   ```

   Content tables (`tracks`, `albums`, `portfolio_items`, `events`,
   `products`, `product_variants`) are readable by anyone once
   `is_published = true`, but only rows owned by an admin (i.e. anyone in
   `public.admins`) can be inserted/updated/deleted — via the Supabase
   Table Editor for now, or a future in-app admin panel, since the RLS
   policies already allow it for a signed-in admin session.

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
- **`albums`** → **`tracks`** (`album_id`, nullable — singles don't need one).
- **`portfolio_items`**, **`events`** — creative updates and past/upcoming
  events; "past" vs "upcoming" is derived from `event_date` at query time.
- **`products`** → **`product_variants`** (one row per size, its own stock —
  so "Medium is sold out, Large isn't" is representable).
- **`orders`** → **`order_items`** (line items pin `unit_price_cents` at
  order time and reference a specific `product_variants` row). Customers can
  only `SELECT`/`INSERT` their own orders — status transitions
  (`pending → paid → fulfilled → ...`) are service-role/webhook-only, so a
  signed-in customer can't mark their own order paid from the browser.

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

- Seed real tracks/portfolio/events/products and confirm the empty states
  give way to real content.
- Shopping cart + checkout — `orders`/`order_items` and a `stripe_payment_intent_id`
  column are already there, Stripe is the obvious fit.
- An actual admin UI in the app itself — the RLS policies already allow an
  admin session to write content directly, so this is mostly front-end work
  at this point, not a data-model change.
- Wire up `play_count`: the `increment_play_count(track_id)` RPC exists and
  is callable by anyone, but nothing calls it yet from the player.
- Queueing and a persistent player across navigations if the music section
  needs to feel more like a real player and less like a list.
