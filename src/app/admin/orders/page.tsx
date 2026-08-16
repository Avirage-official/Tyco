import { requireAdmin } from "@/lib/admin/require-admin";
import { formatDate, formatPrice } from "@/lib/format";
import { updateOrderStatus } from "./actions";
import styles from "../admin.module.css";

const STATUSES = ["pending", "paid", "fulfilled", "cancelled", "refunded"] as const;

export default async function AdminOrdersPage() {
  const { supabase } = await requireAdmin();
  const [{ data: orders }, { data: items }] = await Promise.all([
    supabase
      .from("orders")
      .select(
        "id, customer_email, status, currency, total_cents, created_at, merchize_status, tracking_number, tracking_url"
      )
      .order("created_at", { ascending: false }),
    supabase.from("order_items").select("order_id, quantity"),
  ]);

  const itemCountByOrder = new Map<string, number>();
  for (const item of items ?? []) {
    itemCountByOrder.set(item.order_id, (itemCountByOrder.get(item.order_id) ?? 0) + item.quantity);
  }

  return (
    <div>
      <div className={styles.headerRow}>
        <h2>Orders</h2>
      </div>

      {!orders || orders.length === 0 ? (
        <p className={styles.empty}>No orders yet.</p>
      ) : (
        <div className={styles.tableWrap}>
          <table className={styles.table}>
            <thead>
              <tr>
                <th>Order</th>
                <th>Customer</th>
                <th>Items</th>
                <th>Total</th>
                <th>Placed</th>
                <th>Status</th>
                <th>Merchize</th>
              </tr>
            </thead>
            <tbody>
              {orders.map((order) => (
                <tr key={order.id}>
                  <td className={styles.rowMeta}>{order.id.slice(0, 8)}</td>
                  <td className={styles.rowMeta}>{order.customer_email ?? "—"}</td>
                  <td className={styles.rowMeta}>{itemCountByOrder.get(order.id) ?? 0}</td>
                  <td className={styles.rowTitle}>{formatPrice(order.total_cents, order.currency)}</td>
                  <td className={styles.rowMeta}>{formatDate(order.created_at)}</td>
                  <td>
                    <form
                      action={updateOrderStatus.bind(null, order.id)}
                      style={{ display: "flex", gap: "0.4rem" }}
                    >
                      <select name="status" defaultValue={order.status} className={styles.select}>
                        {STATUSES.map((s) => (
                          <option key={s} value={s}>
                            {s}
                          </option>
                        ))}
                      </select>
                      <button type="submit" className={styles.linkBtn}>
                        Update
                      </button>
                    </form>
                  </td>
                  <td className={styles.rowMeta}>
                    {order.merchize_status ?? "—"}
                    {order.tracking_number && (
                      <>
                        <br />
                        {order.tracking_url ? (
                          <a href={order.tracking_url} target="_blank" rel="noopener noreferrer">
                            {order.tracking_number}
                          </a>
                        ) : (
                          order.tracking_number
                        )}
                      </>
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}
