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
