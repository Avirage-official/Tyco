import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { CreatorPage } from "./CreatorPage";

const CREATOR_COLUMNS =
  "id, slug, name, type, tagline, bio, location, website_url, instagram_url, tiktok_url, youtube_url, spotify_url, avatar_url, banner_url, gallery";

export async function generateMetadata({
  params,
}: {
  params: Promise<{ slug: string }>;
}): Promise<Metadata> {
  const { slug } = await params;
  const supabase = await createClient();
  const { data: creator } = await supabase
    .from("creators")
    .select("name, tagline")
    .eq("slug", slug)
    .eq("is_published", true)
    .maybeSingle();

  if (!creator) return { title: "Creator" };
  return { title: creator.name, description: creator.tagline ?? undefined };
}

export default async function CreatorRoutePage({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;
  const supabase = await createClient();

  const { data: creator } = await supabase
    .from("creators")
    .select(CREATOR_COLUMNS)
    .eq("slug", slug)
    .eq("is_published", true)
    .maybeSingle();

  if (!creator) notFound();

  const [{ data: works }, { data: products }] = await Promise.all([
    supabase
      .from("creator_works")
      .select("id, title, description, cover_url, external_url")
      .eq("creator_id", creator.id)
      .eq("is_published", true)
      .order("display_order", { ascending: true }),
    supabase
      .from("products")
      .select("id, name, price_cents, currency, images, published_at")
      .eq("creator_id", creator.id)
      .eq("is_published", true)
      .order("created_at", { ascending: false }),
  ]);

  return <CreatorPage creator={creator} works={works ?? []} products={products ?? []} />;
}
