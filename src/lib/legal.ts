export type LegalBlock =
  | { type: "heading"; id: string; text: string }
  | { type: "paragraph"; text: string };

function slugify(text: string) {
  return text
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/(^-|-$)/g, "");
}

/**
 * Tiny markdown-ish parser for admin-authored legal content. Supports
 * "## Heading" (or "## Heading {#anchor}" to pin a stable id — used by
 * the shop checkout and ticket checkbox, which link to #shop / #tickets)
 * and blank-line-separated paragraphs. Nothing fancier than that on
 * purpose — this is edited in a plain textarea, not a rich editor.
 */
export function parseLegalContent(raw: string): LegalBlock[] {
  const blocks: LegalBlock[] = [];
  let paragraph: string[] = [];

  function flush() {
    if (paragraph.length > 0) {
      blocks.push({ type: "paragraph", text: paragraph.join(" ").trim() });
      paragraph = [];
    }
  }

  for (const line of raw.split("\n")) {
    const heading = line.match(/^##\s+(.*?)(?:\s*\{#([a-z0-9-]+)\})?\s*$/);
    if (heading) {
      flush();
      const text = heading[1].trim();
      blocks.push({ type: "heading", id: heading[2] ?? slugify(text), text });
    } else if (line.trim() === "") {
      flush();
    } else {
      paragraph.push(line.trim());
    }
  }
  flush();

  return blocks;
}

export const DEFAULT_LEGAL_TERMS = `Last updated — [DATE].

## Acceptance of these terms

These Terms & Conditions govern your use of the Tyco website and every purchase made through it — shop orders and event tickets alike. By creating an account, placing an order, or buying a ticket, you agree to these terms.

## Accounts

You need an account to buy tickets, and you're welcome to create one to check out faster in the shop. You're responsible for keeping your login secure and for everything that happens under your account.

## Shop purchases {#shop}

Product prices are shown at checkout in the listed currency. Placing an order is an offer to buy — we confirm it once payment clears.

Stock is checked at checkout, but in rare cases an item can sell out before payment completes; if that happens on your order we'll contact you to arrange a refund or swap.

Exchanges: if an item doesn't fit, you can exchange it for a different size within 7 days of delivery, provided it's unworn and in its original condition. Outside of that window, or for reasons other than sizing, shop sales are final.

If an item arrives faulty, damaged, or not what you ordered, contact us at [CONTACT EMAIL] within 7 days of delivery for a replacement or refund — this doesn't affect any rights you have under Singapore consumer protection law.

## Event tickets {#tickets}

A ticket is a purchased right to attend a specific event, for the number of people ("pax") stated on it. Every ticket is tied to the account that bought it and is checked in once, by staff, against the reference code on your account — it cannot be reused after check-in.

All ticket sales are final. Tickets are non-refundable and non-exchangeable once purchased, except where a refund is approved at the sole discretion of the event organizers. You confirm this at checkout before a ticket purchase can complete.

If we cancel or materially change an event (date, venue, or it not happening at all), ticket holders will be offered a full refund or credit toward a future event, at our discretion. Entry is subject to available capacity at the door and presentation of the reference code on your account; we reserve the right to refuse entry or remove anyone whose conduct puts other guests, staff, or the event at risk.

## Payments

Payments for both shop orders and tickets are processed by Revolut. We don't store your card details.

## Intellectual property

Everything on this site — the Tyco name, artwork, product designs, photography, and written content — belongs to Tyco or its creators and is protected by copyright and trademark law.

## Liability

To the extent permitted by law, Tyco isn't liable for indirect or consequential losses arising from your use of the site, a shop order, or attendance at an event. Nothing in these terms limits liability that can't legally be limited, such as for death or personal injury caused by negligence.

## Changes to these terms

We may update these terms from time to time. The current version is always the one on this page, effective from the date shown above.

## Governing law

These terms are governed by the laws of the Republic of Singapore, and any dispute is subject to the exclusive jurisdiction of the Singapore courts.

## Contact

Questions about these terms, an order, or a ticket? Reach us at [CONTACT EMAIL].`;
