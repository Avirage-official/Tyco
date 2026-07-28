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
- `/shop` and `/shop/[id]` — retail product grid and product detail. Cart
  and checkout are **not** built yet — "Add to cart" is a stub.
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
   `supabase/schema.sql`. It creates all tables, row-level security
   policies, the auto-profile trigger, and the storage buckets
   (`tracks`, `covers`, `portfolio`, `products`).

4. Run the dev server:

   ```bash
   npm run dev
   ```

   Open [http://localhost:3000](http://localhost:3000).

Content (tracks, portfolio items, events, products) is read from Supabase
with `is_published = true` as the only public policy — for now, publish
content via the Supabase Table Editor or a service-role script. An admin
UI for managing content is a natural next step, not part of this
foundation pass.

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
- Shopping cart + checkout (Stripe is the obvious fit) for the shop.
- An admin area (or just enable authenticated writes via RLS) so content
  doesn't have to go through the Supabase dashboard.
- Play counts, queueing, and a persistent player across navigations if the
  music section needs to feel more like a real player and less like a list.
