import type { Metadata } from "next";
import { PageHeader } from "@/components/ui/PageHeader";
import { createClient } from "@/lib/supabase/server";
import { parseLegalContent, DEFAULT_LEGAL_TERMS } from "@/lib/legal";
import styles from "./terms.module.css";

export const metadata: Metadata = { title: "Terms & Conditions" };

export default async function TermsPage() {
  const supabase = await createClient();
  const { data: settings } = await supabase.from("site_settings").select("legal_terms").eq("id", true).single();

  const blocks = parseLegalContent(settings?.legal_terms || DEFAULT_LEGAL_TERMS);

  return (
    <>
      <PageHeader eyebrow="Legal" title="Terms & Conditions" />
      <div className={`container ${styles.prose}`}>
        {blocks.map((block, i) =>
          block.type === "heading" ? (
            <h2 key={i} id={block.id}>
              {block.text}
            </h2>
          ) : (
            <p key={i}>{block.text}</p>
          )
        )}
      </div>
    </>
  );
}
