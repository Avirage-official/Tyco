import { createClient } from "@/lib/supabase/client";

/**
 * Uploads straight from the browser to Supabase Storage and returns the
 * public URL. Bypasses the Next.js server entirely — deliberately, since
 * routing an audio file through a Vercel server function would run into
 * its request body size limit. Storage RLS (admins-only insert) applies
 * the same as any other write, so this is safe to call from admin forms.
 */
export async function uploadToBucket(bucket: string, file: File) {
  const supabase = createClient();
  const path = `${crypto.randomUUID()}-${file.name}`;

  const { error } = await supabase.storage.from(bucket).upload(path, file, {
    cacheControl: "3600",
    upsert: false,
  });

  if (error) throw error;

  const {
    data: { publicUrl },
  } = supabase.storage.from(bucket).getPublicUrl(path);

  return publicUrl;
}

/**
 * Deletes a previously-uploaded object given its public URL. Best-effort —
 * callers should treat failures as non-fatal cleanup, not a reason to fail
 * whatever save already succeeded.
 */
export async function deleteFromBucket(bucket: string, publicUrl: string) {
  const marker = `/storage/v1/object/public/${bucket}/`;
  const index = publicUrl.indexOf(marker);
  if (index === -1) return;
  const path = decodeURIComponent(publicUrl.slice(index + marker.length));

  const supabase = createClient();
  const { error } = await supabase.storage.from(bucket).remove([path]);
  if (error) throw error;
}
