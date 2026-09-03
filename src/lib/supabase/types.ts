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
};

export type DashboardSlideVisibility = {
  retail?: boolean;
  happenings?: boolean;
};

export type Vendor = {
  id: string;
  name: string;
  is_active: boolean;
  created_at: string;
  updated_at: string;
};

export type VendorAdminNotes = {
  vendor_id: string;
  contact_name: string | null;
  contact_email: string | null;
  contact_phone: string | null;
  notes: string | null;
  created_at: string;
  updated_at: string;
};

export type DealCategory = {
  id: string;
  slug: string;
  name: string;
  display_order: number;
  is_hidden: boolean;
  created_at: string;
  updated_at: string;
};

export type DealSubcategory = {
  id: string;
  category_id: string;
  slug: string;
  name: string;
  display_order: number;
  is_hidden: boolean;
  created_at: string;
  updated_at: string;
};

export type Deal = {
  id: string;
  vendor_id: string;
  subcategory_id: string;
  title: string;
  description: string | null;
  cover_url: string | null;
  locations: string[];
  vendor_rate_cents: number;
  margin_percent: number;
  original_price_cents: number | null;
  currency: string;
  redemptions_per_cycle: number;
  is_published: boolean;
  published_at: string | null;
  created_at: string;
  updated_at: string;
};

export type DealCycle = {
  id: string;
  deal_id: string;
  cycle_start: string;
  redemptions_cap: number;
  redemptions_used: number;
  created_at: string;
  updated_at: string;
};

export type DealRedemptionStatus = "pending" | "paid" | "cancelled" | "refunded";

export type DealRedemption = {
  id: string;
  deal_id: string;
  deal_cycle_id: string;
  vendor_id: string;
  user_id: string;
  vendor_rate_cents: number;
  margin_percent: number;
  member_price_cents: number;
  gateway_fee_percent: number;
  gateway_fee_cents: number;
  total_cents: number;
  tyco_margin_cents: number;
  currency: string;
  status: DealRedemptionStatus;
  revolut_order_id: string | null;
  reference_code: string;
  approved_at: string | null;
  approved_by: string | null;
  redeemed_location: string | null;
  created_at: string;
  updated_at: string;
};

export type EventSlide = {
  id: string;
  title: string;
  location: string | null;
  organizer: string | null;
  event_date: string;
  cover_url: string | null;
};

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
          deal_gateway_fee_percent: number;
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
          deal_gateway_fee_percent?: number;
          updated_at?: string;
        }
      >;
      vendors: Table<
        Vendor,
        { id?: string; name: string; is_active?: boolean; created_at?: string; updated_at?: string }
      >;
      vendor_admin_notes: Table<
        VendorAdminNotes,
        {
          vendor_id: string;
          contact_name?: string | null;
          contact_email?: string | null;
          contact_phone?: string | null;
          notes?: string | null;
          created_at?: string;
          updated_at?: string;
        }
      >;
      deal_categories: Table<
        DealCategory,
        {
          id?: string;
          slug: string;
          name: string;
          display_order?: number;
          is_hidden?: boolean;
          created_at?: string;
          updated_at?: string;
        }
      >;
      deal_subcategories: Table<
        DealSubcategory,
        {
          id?: string;
          category_id: string;
          slug: string;
          name: string;
          display_order?: number;
          is_hidden?: boolean;
          created_at?: string;
          updated_at?: string;
        }
      >;
      deals: Table<
        Deal,
        {
          id?: string;
          vendor_id: string;
          subcategory_id: string;
          title: string;
          description?: string | null;
          cover_url?: string | null;
          locations?: string[];
          vendor_rate_cents: number;
          margin_percent?: number;
          original_price_cents?: number | null;
          currency?: string;
          redemptions_per_cycle: number;
          is_published?: boolean;
          published_at?: string | null;
          created_at?: string;
          updated_at?: string;
        }
      >;
      deal_cycles: Table<
        DealCycle,
        {
          id?: string;
          deal_id: string;
          cycle_start: string;
          redemptions_cap: number;
          redemptions_used?: number;
          created_at?: string;
          updated_at?: string;
        }
      >;
      deal_redemptions: Table<
        DealRedemption,
        {
          id?: string;
          deal_id: string;
          deal_cycle_id: string;
          vendor_id: string;
          user_id: string;
          vendor_rate_cents: number;
          margin_percent: number;
          member_price_cents: number;
          gateway_fee_percent: number;
          gateway_fee_cents: number;
          total_cents: number;
          tyco_margin_cents: number;
          currency?: string;
          status?: DealRedemptionStatus;
          revolut_order_id?: string | null;
          reference_code?: string;
          approved_at?: string | null;
          approved_by?: string | null;
          redeemed_location?: string | null;
          created_at?: string;
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
      get_or_create_deal_cycle: {
        Args: { p_deal_id: string };
        Returns: DealCycle;
      };
      increment_deal_cycle_redemptions: {
        Args: { p_cycle_id: string; p_quantity: number };
        Returns: undefined;
      };
      approve_deal_redemption: {
        Args: { p_redemption_id: string; p_location: string | null };
        Returns: DealRedemption;
      };
    };
    Enums: Record<string, never>;
    CompositeTypes: Record<string, never>;
  };
}
