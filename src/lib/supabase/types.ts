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

export type DashboardSlideImages = {
  retail?: string;
  happenings?: string;
  creators?: string;
  services?: string;
};

export type DashboardSlideVisibility = {
  retail?: boolean;
  happenings?: boolean;
  creators?: boolean;
  services?: boolean;
};

export type EventSlide = {
  id: string;
  title: string;
  location: string | null;
  organizer: string | null;
  event_date: string;
  cover_url: string | null;
};

export type CreatorType =
  | "musician"
  | "visual_artist"
  | "influencer"
  | "designer"
  | "photographer"
  | "other";

export type EventTicket = {
  id: string;
  event_id: string;
  user_id: string;
  quantity: number;
  unit_price_cents: number;
  total_cents: number;
  currency: string;
  status: "pending" | "paid" | "cancelled" | "refunded";
  revolut_order_id: string | null;
  reference_code: string;
  checked_in_at: string | null;
  checked_in_by: string | null;
  created_at: string;
  updated_at: string;
};

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
      creators: Table<
        {
          id: string;
          slug: string;
          name: string;
          type: CreatorType;
          tagline: string | null;
          bio: string | null;
          location: string | null;
          website_url: string | null;
          instagram_url: string | null;
          tiktok_url: string | null;
          youtube_url: string | null;
          spotify_url: string | null;
          avatar_url: string | null;
          banner_url: string | null;
          gallery: AboutSlide[];
          tags: string[];
          display_order: number;
          is_featured: boolean;
          is_published: boolean;
          published_at: string | null;
          created_at: string;
          updated_at: string;
        },
        {
          id?: string;
          slug: string;
          name: string;
          type: CreatorType;
          tagline?: string | null;
          bio?: string | null;
          location?: string | null;
          website_url?: string | null;
          instagram_url?: string | null;
          tiktok_url?: string | null;
          youtube_url?: string | null;
          spotify_url?: string | null;
          avatar_url?: string | null;
          banner_url?: string | null;
          gallery?: AboutSlide[];
          tags?: string[];
          display_order?: number;
          is_featured?: boolean;
          is_published?: boolean;
          published_at?: string | null;
          created_at?: string;
          updated_at?: string;
        }
      >;
      creator_admin_notes: Table<
        { creator_id: string; notes: string | null; created_at: string; updated_at: string },
        { creator_id: string; notes?: string | null; created_at?: string; updated_at?: string }
      >;
      creator_works: Table<
        {
          id: string;
          creator_id: string;
          title: string;
          description: string | null;
          cover_url: string | null;
          media_url: string | null;
          media_type: "image" | "video" | null;
          external_url: string | null;
          display_order: number;
          is_published: boolean;
          published_at: string | null;
          created_at: string;
          updated_at: string;
        },
        {
          id?: string;
          creator_id: string;
          title: string;
          description?: string | null;
          cover_url?: string | null;
          media_url?: string | null;
          media_type?: "image" | "video" | null;
          external_url?: string | null;
          display_order?: number;
          is_published?: boolean;
          published_at?: string | null;
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
          organizer: string | null;
          event_date: string;
          cover_url: string | null;
          cover_video_url: string | null;
          ticket_url: string | null;
          price_cents: number;
          currency: string;
          capacity: number | null;
          capacity_remaining: number | null;
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
          organizer?: string | null;
          event_date: string;
          cover_url?: string | null;
          cover_video_url?: string | null;
          ticket_url?: string | null;
          price_cents?: number;
          currency?: string;
          capacity?: number | null;
          capacity_remaining?: number | null;
          is_published?: boolean;
          published_at?: string | null;
          created_at?: string;
          updated_at?: string;
        }
      >;
      event_tickets: Table<
        EventTicket,
        {
          id?: string;
          event_id: string;
          user_id: string;
          quantity?: number;
          unit_price_cents: number;
          total_cents: number;
          currency?: string;
          status?: "pending" | "paid" | "cancelled" | "refunded";
          revolut_order_id?: string | null;
          reference_code?: string;
          checked_in_at?: string | null;
          checked_in_by?: string | null;
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
          creator_id: string | null;
          is_featured: boolean;
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
          creator_id?: string | null;
          is_featured?: boolean;
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
          merchize_variant_code: string | null;
          created_at: string;
          updated_at: string;
        },
        {
          id?: string;
          product_id: string;
          size: string;
          sku?: string | null;
          stock?: number;
          merchize_variant_code?: string | null;
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
          merchize_order_id: string | null;
          merchize_status: string | null;
          merchize_item_summary: string | null;
          tracking_number: string | null;
          tracking_url: string | null;
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
          merchize_order_id?: string | null;
          merchize_status?: string | null;
          merchize_item_summary?: string | null;
          tracking_number?: string | null;
          tracking_url?: string | null;
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
          mission_blurb: string | null;
          about_gallery: AboutSlide[];
          legal_terms: string | null;
          dashboard_slide_images: DashboardSlideImages;
          dashboard_hidden_slides: DashboardSlideVisibility;
          updated_at: string;
        },
        {
          id?: boolean;
          next_project_title?: string | null;
          next_project_body?: string | null;
          next_project_image_url?: string | null;
          mission_raised_cents?: number;
          mission_goal_cents?: number;
          mission_blurb?: string | null;
          about_gallery?: AboutSlide[];
          legal_terms?: string | null;
          dashboard_slide_images?: DashboardSlideImages;
          dashboard_hidden_slides?: DashboardSlideVisibility;
          updated_at?: string;
        }
      >;
      webhook_errors: Table<
        {
          id: string;
          source: "revolut" | "merchize";
          message: string;
          context: Json | null;
          created_at: string;
        },
        {
          id?: string;
          source: "revolut" | "merchize";
          message: string;
          context?: Json | null;
          created_at?: string;
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
      decrement_event_capacity: {
        Args: { p_event_id: string; p_quantity: number };
        Returns: undefined;
      };
      check_in_ticket: {
        Args: { p_ticket_id: string };
        Returns: EventTicket;
      };
    };
    Enums: Record<string, never>;
    CompositeTypes: Record<string, never>;
  };
}
