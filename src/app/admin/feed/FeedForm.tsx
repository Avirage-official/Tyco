"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/Button";
import { createFeedItem, updateFeedItem, type FeedItemInput } from "./actions";
import styles from "../admin.module.css";

type FeedItem = {
  id: string;
  type: "release" | "news";
  title: string;
  body: string | null;
  cover_url: string | null;
  source_url: string | null;
  release_date: string | null;
  discovery: "manual" | "curated" | "search";
};

function toDateInputValue(iso: string | null) {
  if (!iso) return "";
  return iso.slice(0, 10);
}

export function FeedForm({ item }: { item?: FeedItem }) {
  const router = useRouter();
  const [type, setType] = useState<"release" | "news">(item?.type ?? "release");
  const [title, setTitle] = useState(item?.title ?? "");
  const [body, setBody] = useState(item?.body ?? "");
  const [coverUrl, setCoverUrl] = useState(item?.cover_url ?? "");
  const [sourceUrl, setSourceUrl] = useState(item?.source_url ?? "");
  const [releaseDate, setReleaseDate] = useState(toDateInputValue(item?.release_date ?? null));
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setSaving(true);
    setError(null);

    try {
      const input: FeedItemInput = {
        type,
        title,
        body: body || null,
        cover_url: coverUrl || null,
        source_url: sourceUrl || null,
        release_date: releaseDate ? new Date(releaseDate).toISOString() : null,
      };

      if (item) {
        await updateFeedItem(item.id, input);
      } else {
        await createFeedItem(input);
      }

      router.push("/admin/feed");
      router.refresh();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Something went wrong");
      setSaving(false);
    }
  }

  return (
    <form className={styles.form} onSubmit={handleSubmit}>
      {item && item.discovery !== "manual" && (
        <p className={styles.hint}>
          {item.discovery === "search"
            ? "Found via open keyword search — double-check this is a genuine, relevant release before publishing."
            : "Found via a curated channel."}
        </p>
      )}

      <div className={styles.field}>
        <label className={styles.label} htmlFor="type">
          Type
        </label>
        <select
          id="type"
          className={styles.select}
          value={type}
          onChange={(e) => setType(e.target.value as "release" | "news")}
        >
          <option value="release">Release</option>
          <option value="news">News</option>
        </select>
      </div>

      <div className={styles.field}>
        <label className={styles.label} htmlFor="title">
          Title
        </label>
        <input
          id="title"
          className={styles.input}
          required
          value={title}
          onChange={(e) => setTitle(e.target.value)}
        />
      </div>

      <div className={styles.field}>
        <label className={styles.label} htmlFor="body">
          Blurb
        </label>
        <textarea id="body" className={styles.textarea} value={body} onChange={(e) => setBody(e.target.value)} />
      </div>

      <div className={styles.field}>
        <label className={styles.label} htmlFor="cover">
          Cover image URL
        </label>
        {coverUrl && <div className={styles.preview} style={{ backgroundImage: `url(${coverUrl})` }} />}
        <input
          id="cover"
          className={styles.input}
          placeholder="https://..."
          value={coverUrl}
          onChange={(e) => setCoverUrl(e.target.value)}
        />
      </div>

      <div className={styles.field}>
        <label className={styles.label} htmlFor="source">
          Link (YouTube video, article, etc.)
        </label>
        <input
          id="source"
          className={styles.input}
          placeholder="https://youtube.com/watch?v=..."
          value={sourceUrl}
          onChange={(e) => setSourceUrl(e.target.value)}
        />
      </div>

      <div className={styles.field}>
        <label className={styles.label} htmlFor="releaseDate">
          Release / event date
        </label>
        <input
          id="releaseDate"
          type="date"
          className={styles.input}
          value={releaseDate}
          onChange={(e) => setReleaseDate(e.target.value)}
        />
      </div>

      {error && <p className={styles.error}>{error}</p>}

      <div className={styles.formActions}>
        <Button type="submit" disabled={saving}>
          {saving ? "Saving…" : item ? "Save changes" : "Create item"}
        </Button>
      </div>
    </form>
  );
}
