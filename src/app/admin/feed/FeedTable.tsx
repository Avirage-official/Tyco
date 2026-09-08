"use client";

import { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { formatDate } from "@/lib/format";
import { PublishBadge } from "../PublishBadge";
import { toggleFeedPublish, deleteFeedItem, bulkSetFeedPublished, bulkDeleteFeedItems } from "./actions";
import styles from "../admin.module.css";

const DISCOVERY_LABEL: Record<string, string> = {
  manual: "Manual",
  curated: "Curated channel",
  search: "Open search",
};

type FeedRow = {
  id: string;
  type: string;
  title: string;
  cover_url: string | null;
  discovery: string;
  is_published: boolean;
  release_date: string | null;
  is_english: boolean;
};

export function FeedTable({ items }: { items: FeedRow[] }) {
  const router = useRouter();
  const [selected, setSelected] = useState<Set<string>>(new Set());
  const [pending, setPending] = useState(false);

  const allSelected = items.length > 0 && selected.size === items.length;

  function toggleAll() {
    setSelected(allSelected ? new Set() : new Set(items.map((item) => item.id)));
  }

  function toggleOne(id: string) {
    setSelected((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  }

  async function runBulk(action: () => Promise<void>) {
    setPending(true);
    try {
      await action();
      setSelected(new Set());
      router.refresh();
    } finally {
      setPending(false);
    }
  }

  return (
    <>
      {selected.size > 0 && (
        <div className={styles.bulkBar}>
          <span className={styles.bulkCount}>{selected.size} selected</span>
          <div className={styles.actions}>
            <button
              type="button"
              className={styles.linkBtn}
              disabled={pending}
              onClick={() => runBulk(() => bulkSetFeedPublished(Array.from(selected), true))}
            >
              Publish
            </button>
            <button
              type="button"
              className={styles.linkBtn}
              disabled={pending}
              onClick={() => runBulk(() => bulkSetFeedPublished(Array.from(selected), false))}
            >
              Unpublish
            </button>
            <button
              type="button"
              className={styles.dangerBtn}
              disabled={pending}
              onClick={() => {
                if (!window.confirm(`Delete ${selected.size} item(s)? This can't be undone.`)) return;
                runBulk(() => bulkDeleteFeedItems(Array.from(selected)));
              }}
            >
              Delete
            </button>
          </div>
        </div>
      )}

      <div className={styles.tableWrap}>
        <table className={styles.table}>
          <thead>
            <tr>
              <th>
                <input type="checkbox" checked={allSelected} onChange={toggleAll} aria-label="Select all" />
              </th>
              <th></th>
              <th>Title</th>
              <th>Type</th>
              <th>Source</th>
              <th>Lang</th>
              <th>Release date</th>
              <th>Status</th>
              <th></th>
            </tr>
          </thead>
          <tbody>
            {items.map((item) => (
              <tr key={item.id}>
                <td>
                  <input
                    type="checkbox"
                    checked={selected.has(item.id)}
                    onChange={() => toggleOne(item.id)}
                    aria-label={`Select ${item.title}`}
                  />
                </td>
                <td>
                  <div
                    className={styles.rowThumb}
                    style={item.cover_url ? { backgroundImage: `url(${item.cover_url})` } : undefined}
                  />
                </td>
                <td className={styles.rowTitle}>{item.title}</td>
                <td className={styles.rowMeta}>{item.type}</td>
                <td className={styles.rowMeta}>{DISCOVERY_LABEL[item.discovery] ?? item.discovery}</td>
                <td className={styles.rowMeta}>{item.is_english ? "EN" : "—"}</td>
                <td className={styles.rowMeta}>{item.release_date ? formatDate(item.release_date) : "—"}</td>
                <td>
                  <PublishBadge isPublished={item.is_published} />
                </td>
                <td>
                  <div className={styles.actions}>
                    <Link href={`/admin/feed/${item.id}`} className={styles.linkBtn}>
                      Edit
                    </Link>
                    <form action={toggleFeedPublish.bind(null, item.id, !item.is_published)}>
                      <button type="submit" className={styles.linkBtn}>
                        {item.is_published ? "Unpublish" : "Publish"}
                      </button>
                    </form>
                    <form action={deleteFeedItem.bind(null, item.id)}>
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
    </>
  );
}
