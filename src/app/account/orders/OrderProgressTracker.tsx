import type { MerchizeProgressStep } from "@/lib/checkout/merchize";
import { formatDate } from "@/lib/format";
import styles from "./orders.module.css";

// Only the milestones a customer actually cares about — Merchize's own
// event list also includes internal/back-office events like
// fulfillment_cost_paid (us paying them) that would just be confusing here.
const STEP_LABELS: Record<string, string> = {
  order_imported: "Order received",
  in_production: "In production",
  shipment_started: "Shipped",
  in_transit: "In transit",
  delivered: "Delivered",
};

export function OrderProgressTracker({ steps }: { steps: MerchizeProgressStep[] }) {
  const visible = steps.filter((step) => STEP_LABELS[step.event]);
  if (visible.length === 0) return null;

  return (
    <div className={styles.progress}>
      {visible.map((step) => (
        <div
          key={step.event}
          className={`${styles.progressStep} ${step.status === "done" ? styles.progressStepDone : ""}`}
        >
          <span className={styles.progressDot} aria-hidden />
          <span className={styles.progressLabel}>{STEP_LABELS[step.event]}</span>
          {step.actual && <span className={styles.progressDate}>{formatDate(step.actual)}</span>}
        </div>
      ))}
    </div>
  );
}
