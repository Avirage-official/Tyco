import Link from "next/link";
import { requireAdmin } from "@/lib/admin/require-admin";
import { formatPrice } from "@/lib/format";
import { PublishBadge } from "../PublishBadge";
import { toggleProductPublish, deleteProduct } from "./actions";
import styles from "../admin.module.css";

export default async function AdminProductsPage() {
  const { supabase } = await requireAdmin();
  const [{ data: products }, { data: variants }] = await Promise.all([
    supabase
      .from("products")
      .select("id, name, price_cents, currency, images, is_published")
      .order("created_at", { ascending: false }),
    supabase.from("product_variants").select("product_id, stock"),
  ]);

  const stockByProduct = new Map<string, number>();
  for (const v of variants ?? []) {
    stockByProduct.set(v.product_id, (stockByProduct.get(v.product_id) ?? 0) + v.stock);
  }

  return (
    <div>
      <div className={styles.headerRow}>
        <h2>Products</h2>
        <Link href="/admin/products/new" className={styles.linkBtn}>
          + New product
        </Link>
      </div>

      {!products || products.length === 0 ? (
        <p className={styles.empty}>No products yet.</p>
      ) : (
        <div className={styles.tableWrap}>
          <table className={styles.table}>
            <thead>
              <tr>
                <th></th>
                <th>Name</th>
                <th>Price</th>
                <th>Stock</th>
                <th>Status</th>
                <th></th>
              </tr>
            </thead>
            <tbody>
              {products.map((product) => (
                <tr key={product.id}>
                  <td>
                    <div
                      className={styles.rowThumb}
                      style={product.images?.[0] ? { backgroundImage: `url(${product.images[0]})` } : undefined}
                    />
                  </td>
                  <td className={styles.rowTitle}>{product.name}</td>
                  <td className={styles.rowMeta}>{formatPrice(product.price_cents, product.currency)}</td>
                  <td className={styles.rowMeta}>{stockByProduct.get(product.id) ?? 0}</td>
                  <td>
                    <PublishBadge isPublished={product.is_published} />
                  </td>
                  <td>
                    <div className={styles.actions}>
                      <Link href={`/admin/products/${product.id}`} className={styles.linkBtn}>
                        Edit
                      </Link>
                      <form action={toggleProductPublish.bind(null, product.id, !product.is_published)}>
                        <button type="submit" className={styles.linkBtn}>
                          {product.is_published ? "Unpublish" : "Publish"}
                        </button>
                      </form>
                      <form action={deleteProduct.bind(null, product.id)}>
                        <button type="submit" className={styles.dangerBtn}>
                          Delete
                        </button>
                      </form>
                    </div>
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
