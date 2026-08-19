import type { Metadata } from "next";
import { PageHeader } from "@/components/ui/PageHeader";
import styles from "./terms.module.css";

export const metadata: Metadata = { title: "Terms & Conditions" };

export default function TermsPage() {
  return (
    <>
      <PageHeader
        eyebrow="Legal"
        title="Terms & Conditions"
        description="Last updated — [DATE]. Please read these terms before buying from the shop or getting tickets to an event."
      />
      <div className={`container ${styles.prose}`}>
        <section>
          <h2>1. Acceptance of these terms</h2>
          <p>
            These Terms &amp; Conditions govern your use of the Tyco website and every purchase made
            through it — shop orders and event tickets alike. By creating an account, placing an
            order, or buying a ticket, you agree to these terms. If you don&rsquo;t agree to them,
            please don&rsquo;t use the site.
          </p>
        </section>

        <section>
          <h2>2. Accounts</h2>
          <p>
            You need an account to buy tickets, and you&rsquo;re welcome to create one to check out
            faster in the shop. You&rsquo;re responsible for keeping your login secure and for
            everything that happens under your account.
          </p>
        </section>

        <section id="shop">
          <h2>3. Shop purchases</h2>
          <p>
            Product prices are shown at checkout in the listed currency and include everything
            payable to us; they don&rsquo;t include any import duties or taxes that may apply once
            an order crosses into your country. Placing an order is an offer to buy — we confirm it
            once payment clears.
          </p>
          <p>
            <strong>Stock &amp; availability.</strong> We check stock at checkout, but in rare cases
            an item can sell out between adding it to your cart and paying. If that happens on your
            order, we&rsquo;ll contact you at the email you checked out with to sort out a refund or
            swap.
          </p>
          <p>
            <strong>Order fulfilment.</strong> Paid orders are sent to our fulfilment partner for
            production and shipping. You&rsquo;ll get tracking information once it ships.
          </p>
          <p>
            <strong>Returns &amp; refunds.</strong> If an item arrives faulty, damaged, or not what
            you ordered, contact us at [CONTACT EMAIL] within [XX] days of delivery and we&rsquo;ll
            arrange a replacement or refund. Outside of that, all shop sales are final, except where
            applicable consumer protection law gives you a right we can&rsquo;t contract around.
          </p>
        </section>

        <section id="tickets">
          <h2>4. Event tickets</h2>
          <p>
            A ticket is a purchased right to attend a specific event, for the number of people
            (&ldquo;pax&rdquo;) stated on it. Every ticket is tied to the account that bought it and
            is checked in once, by staff, against the reference code shown on your account — it
            cannot be reused after check-in.
          </p>
          <p>
            <strong>All ticket sales are final.</strong> Tickets are non-refundable and
            non-exchangeable once purchased, except where a refund is approved at the sole discretion
            of the event organizers. You confirm this at checkout before you can complete a ticket
            purchase.
          </p>
          <p>
            <strong>If we cancel or materially change an event</strong> (for example the date, venue,
            or the event not happening at all), ticket holders will be offered a full refund or
            credit toward a future event, at our discretion. We are not responsible for any other
            costs you incur in connection with an event (travel, accommodation, or otherwise).
          </p>
          <p>
            <strong>Entry.</strong> Entry is subject to available capacity at the door, presentation
            of the reference code on your account, and any venue or event-specific conditions
            communicated at the time. We reserve the right to refuse entry or remove anyone whose
            conduct puts other guests, staff, or the event at risk.
          </p>
        </section>

        <section>
          <h2>5. Payments</h2>
          <p>
            Payments for both shop orders and tickets are processed by Revolut. We don&rsquo;t store
            your card details — Revolut handles that in line with their own terms and security
            standards. Prices are charged in the currency shown at checkout.
          </p>
        </section>

        <section>
          <h2>6. Intellectual property</h2>
          <p>
            Everything on this site — the Tyco name, artwork, product designs, photography, and
            written content — belongs to Tyco or its creators and is protected by copyright and
            trademark law. You can browse and share it for personal, non-commercial use; you
            can&rsquo;t reproduce, resell, or otherwise use it commercially without our permission.
          </p>
        </section>

        <section>
          <h2>7. Liability</h2>
          <p>
            We try to keep this site and the events we run accurate, safe, and running smoothly, but
            we can&rsquo;t guarantee it&rsquo;ll always be uninterrupted or error-free. To the extent
            permitted by law, Tyco isn&rsquo;t liable for indirect or consequential losses arising
            from your use of the site, a shop order, or attendance at an event. Nothing in these
            terms limits liability that can&rsquo;t legally be limited, such as for death or personal
            injury caused by negligence.
          </p>
        </section>

        <section>
          <h2>8. Changes to these terms</h2>
          <p>
            We may update these terms from time to time — for example as the shop, ticketing, or our
            partners change. The current version is always the one on this page, and it applies from
            the date shown above.
          </p>
        </section>

        <section>
          <h2>9. Governing law</h2>
          <p>These terms are governed by the laws of [JURISDICTION].</p>
        </section>

        <section>
          <h2>10. Contact</h2>
          <p>Questions about these terms, an order, or a ticket? Reach us at [CONTACT EMAIL].</p>
        </section>
      </div>
    </>
  );
}
