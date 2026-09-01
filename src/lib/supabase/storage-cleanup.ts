import "server-only";
import type { requireAdmin } from "@/lib/admin/require-admin";
import { getStoragePath } from "./upload";

/**
 * Server-side counterpart to deleteFromBucket, for row-delete server actions
 * (which have no client-side form wrapper to call the browser version from).
 * Best-effort — called after the row delete already succeeded, so a storage
 * failure here is an orphaned file, not lost data.
 */
export async function deleteStorageUrls(
  supabase: Awaited<ReturnType<typeof requireAdmin>>["supabase"],
  bucket: string,
  urls: (string | null | undefined)[]
) {
  const paths = urls
    .filter((url): url is string => Boolean(url))
    .map((url) => getStoragePath(bucket, url))
    .filter((path): path is string => Boolean(path));

  if (paths.length === 0) return;
  await supabase.storage.from(bucket).remove(paths);
}
