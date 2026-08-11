/**
 * Hand-written types mirroring supabase/schema.sql.
 * Once the project is linked, replace with generated types:
 *   npx supabase gen types typescript --project-id <id> > src/lib/supabase/types.ts
 */

export type Json =
  | string
  | number
  | boolean
  | null
  | { [key: string]: Json | undefined }
  | Json[];

type Table<Row, Insert, Update = Partial<Insert>> = {
  Row: Row;
  Insert: Insert;
  Update: Update;
  Relationships: [];
};

export type AboutSlide = { url: string; type: "image" | "video" };

export interface Database {
  public: {
    Tables: {
      admins: Table<
        { user_id: string; created_at: string },
        { user_id: string; created_at?: string }
      >;
      profiles: Table<
        {
          id: string;
          username: string | null;
          display_name: string | null;
          avatar_url: string | null;
          created_at: string;
          updated_at: string;
        },
        {
          id: string;
          username?: string | null;
          display_name?: string | null;
          avatar_url?: string | null;
          created_at?: string;
          updated_at?: string;
        }
      >;
      portfolio_items: Table<
        {
          id: string;
          title: string;
          description: string | null;
          category: string | null;
          cover_url: string | null;
          media_url: string | null;
          media_type: "image" | "video" | null;
          images: string[];
          is_published: boolean;
          published_at: string | null;
          created_at: string;
          updated_at: string;
        },
        {
          id?: string;
          title: string;
          description?: string | null;
          category?: string | null;
          cover_url?: string | null;
          media_url?: string | null;
          media_type?: "image" | "video" | null;
          images?: string[];
          is_published?: boolean;
          published_at?: string | null;
          created_at?: string;
          updated_at?: string;
        }
      >;
      events: Table<
        {
          id: string;
          title: string;
          description: string | null;
          location: string | null;
          event_date: string;
          cover_url: string | null;
          ticket_url: string | null;
          is_published: boolean;
          published_at: string | null;
          created_at: string;
          updated_at: string;
        },
        {
          id?: string;
          title: string;
          description?: string | null;
          location?: string | null;
          event_date: string;
          cover_url?: string | null;
          ticket_url?: string | null;
          is_published?: boolean;
          published_at?: string | null;
          created_at?: string;
          updated_at?: string;
        }
      >;
      products: Table<
        {
          id: string;
          name: string;
          description: string | null;
          price_cents: number;
          currency: string;
          images: string[];
          category: string | null;
          is_published: boolean;
          published_at: string | null;
          created_at: string;
          updated_at: string;
        },
        {
          id?: string;
          name: string;
          description?: string | null;
          price_cents: number;
          currency?: string;
          images?: string[];
          category?: string | null;
          is_published?: boolean;
          published_at?: string | null;
          created_at?: string;
          updated_at?: string;
        }
      >;
      product_variants: Table<
        {
          id: string;
          product_id: string;
          size: string;
          sku: string | null;
          stock: number;
          created_at: string;
          updated_at: string;
        },
        {
          id?: string;
          product_id: string;
          size: string;
          sku?: string | null;
          stock?: number;
          created_at?: string;
          updated_at?: string;
        }
      >;
      orders: Table<
        {
          id: string;
          user_id: string | null;
          customer_email: string | null;
          status: "pending" | "paid" | "fulfilled" | "cancelled" | "refunded";
          currency: string;
          total_cents: number;
          shipping_address: Json | null;
          stripe_payment_intent_id: string | null;
          revolut_order_id: string | null;
          created_at: string;
          updated_at: string;
        },
        {
          id?: string;
          user_id?: string | null;
          customer_email?: string | null;
          status?: "pending" | "paid" | "fulfilled" | "cancelled" | "refunded";
          currency?: string;
          total_cents?: number;
          shipping_address?: Json | null;
          stripe_payment_intent_id?: string | null;
          revolut_order_id?: string | null;
          created_at?: string;
          updated_at?: string;
        }
      >;
      order_items: Table<
        {
          id: string;
          order_id: string;
          variant_id: string;
          quantity: number;
          unit_price_cents: number;
          created_at: string;
        },
        {
          id?: string;
          order_id: string;
          variant_id: string;
          quantity?: number;
          unit_price_cents: number;
          created_at?: string;
        }
      >;
      site_settings: Table<
        {
          id: boolean;
          next_project_title: string | null;
          next_project_body: string | null;
          next_project_image_url: string | null;
          mission_raised_cents: number;
          mission_goal_cents: number;
          about_gallery: AboutSlide[];
          updated_at: string;
        },
        {
          id?: boolean;
          next_project_title?: string | null;
          next_project_body?: string | null;
          next_project_image_url?: string | null;
          mission_raised_cents?: number;
          mission_goal_cents?: number;
          about_gallery?: AboutSlide[];
          updated_at?: string;
        }
      >;
    };
    Views: Record<string, never>;
    Functions: {
      is_admin: {
        Args: Record<string, never>;
        Returns: boolean;
      };
      decrement_variant_stock: {
        Args: { p_variant_id: string; p_quantity: number };
        Returns: undefined;
      };
    };
    Enums: Record<string, never>;
    CompositeTypes: Record<string, never>;
  };
}
