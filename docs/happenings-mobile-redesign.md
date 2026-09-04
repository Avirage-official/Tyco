# Happenings page — light theme + card redesign

Living spec for the `/studio` (Happenings) page redesign. Primary reference:
the second screenshot shared in chat — the light-mode "Discover Your Best
Clothes" fashion app (cream background, black category pills, rounded promo
banner, image-top/white-body product cards, floating pill bottom nav).

Scope is deliberately narrow: **`/studio` only** (the events/Happenings
listing — hero, "More dates" grid, "Past events" strip, plus the shared
sidebar/tabs/banner chrome). `/studio/deals` keeps its current dark theme
and overlay-style cards — the user said "the happening page," not deals.
Deals gets its own pass later if this direction is confirmed.

## Why the previous attempt (PR #54) still read as "vibe coded"

- It kept the site's all-dark theme instead of adopting the reference's
  actual light palette.
- The grid cards kept the sitewide "full-bleed photo + scrim + text
  overlaid on the image" anatomy. The reference's cards are a completely
  different, more common component shape: **image contained in a rounded
  frame, on top; a separate plain-background body underneath carries the
  title/meta/price in ordinary text.** Overlaying text on every single
  small grid thumbnail (rather than reserving that treatment for a hero
  banner) is what read as generic/AI rather than "a real component
  library."
- Fix: give grid cards the image-top/body-below anatomy. Notably,
  `EventHero` (the big featured-event block) *already* works this way —
  its image block has no text in it; date/title/meta live in a body
  section below. So this isn't a new idiom for the site, it's making the
  small grid cards consistent with the site's own hero, instead of
  reusing the deals-style overlay poster card.

## Color tokens (scoped to `/studio` events route only)

Soft light orange/red primary, brown secondary — applied as a scoped
CSS-variable override (`.happeningsTheme` in `studio.module.css`), not a
change to `globals.css`. The rest of the site (including `/studio/deals`)
is untouched; dark stays "the brand background" everywhere else per the
existing comment in `globals.css`.

| token | value | role |
|---|---|---|
| `--bg` | `#FAF1E6` | page background, warm cream |
| `--bg-raised` / `--surface` | `#FFFFFF` | card bodies |
| `--border` | `#EEDFC9` | hairlines, dividers |
| `--fg` | `#3B2A1F` | primary text — brown, not black |
| `--fg-muted` | `#8C7361` | secondary text (meta rows, muted labels) |
| `--accent` | `#E3794C` | soft light orange/red — CTAs, price, active pill |
| `--accent-strong` | `#C85A34` | hover/active state of accent |
| `--accent-soft` | `rgba(227,121,76,0.16)` | tinted backgrounds (chips) |
| `--on-accent` | `#FFF8F0` | text/icons on accent-filled elements |
| `--card-shadow` (new, local to this scope) | `0 2px 14px rgba(59,42,31,0.08)` | soft elevation cards get in light mode; dark mode has no shadow system so this is a scoped-only token with a `none` fallback |

No separate "brown secondary" token was needed in the end — `--fg` and
`--fg-muted` are themselves brown (`#3B2A1F` / `#8C7361`), so the brown
shows up everywhere text does, which is what "brown secondary color"
meant in practice once applied.

Raw brand constants (`--ink`, `--paper`, `--red*`) are **not** overridden —
those are building blocks used elsewhere on the site; only the semantic
tokens that are meant to vary by theme are swapped.

## What stays dark (deliberate, not an oversight)

- **The detail takeover modal** (tap a card → full-screen purchase view)
  stays in the site's dark brand treatment, unchanged from PR #53. It's
  portaled to `document.body`, so it renders outside the page-scoped
  theme wrapper by construction — and keeping it dark also keeps it
  visually consistent with the Deals modal, which isn't re-themed either.
  The light theme applies to the *browsing* layer, not the purchase flow.
- **The mobile sticky "buy" bar** (`MobileBookingBar`, inside `EventHero`)
  portals to `document.body` on mobile for unrelated layout reasons (see
  its own doc comment), which also escapes the `.happeningsTheme` div. It
  reapplies the theme class directly on its portaled wrapper — safe to
  hardcode since this component only ever renders on the Happenings route.
- **The `SwipeDashboard` full-viewport slide deck** (the immersive
  cinematic browsing mode between the hero and the grid) is left as-is.
  It's a distinct, separately-scoped feature shared with the homepage,
  not part of the reference's product-grid aesthetic — re-theming it
  wasn't asked for and would fight its full-bleed editorial design.

## Component mapping

| Reference | TYCO equivalent | Change |
|---|---|---|
| Header title ("Discover Your Best Clothes") | `PageHeader` ("Happenings") | recolor only, via scope |
| Category pills (Men/Women/Kids…) | `StudioTabs` (Happenings/Deals) | recolor: active = `--accent` fill, inactive = `--secondary` outline/text |
| Promo/feature banner | `StudioFeatureBanner` | recolors automatically via the scope (it already only used tokens) — left structurally untouched since it's shared chrome rendered on both `/studio` and `/studio/deals`; still an honest "Coming soon" placeholder — no fabricated promo copy |
| Product grid, 2-up mobile | "More dates" grid (`EventCard`) | **restructure**: image-top (rounded, grayscale-duotone kept for brand consistency) with a small date badge on the image corner, plain white body below with title / weekday·time·location / price |
| Heart icon (wishlist) | — | **excluded** — no wishlist feature exists; would be fake affordance |
| Star rating pill | — | **excluded** — no rating data exists; would be fabricated |
| Floating pill bottom nav | site's existing bottom tab bar | unchanged, out of scope (site-wide component) |

The grid card's `Waveform` hover flourish (animated bars) was dropped —
it was a nice-to-have on the old overlay card but has no place on a
plain image-top/body card, and the reference doesn't have an equivalent.

`EventHero` (the single big featured event above the grid) keeps its
existing image-top/body-below structure and overlay scrim on the image —
that's the one place an overlay is appropriate (it's a hero/banner
moment, same idiom as the reference's own promo banner), it just
inherits the new light colors for its body text automatically through
the scope.

## Explicitly excluded / deferred (unchanged from earlier decisions)

- Event category chips on cards — event category taxonomy doesn't exist
  yet, deferred to later (per earlier conversation).
- "+" quick-add buttons — bypasses the details-before-purchase flow that
  was deliberately built; still excluded.
- Wishlist hearts, star ratings — no backing data; excluded per the
  no-fabricated-data rule.
