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

export interface Database {
  public: {
    Tables: {
      profiles: Table<
        {
          id: string;
          username: string | null;
          display_name: string | null;
          avatar_url: string | null;
          is_admin: boolean;
          created_at: string;
        },
        {
          id: string;
          username?: string | null;
          display_name?: string | null;
          avatar_url?: string | null;
          is_admin?: boolean;
          created_at?: string;
        }
      >;
      tracks: Table<
        {
          id: string;
          title: string;
          artist: string;
          album: string | null;
          cover_url: string | null;
          audio_url: string;
          duration_seconds: number | null;
          track_number: number | null;
          release_date: string | null;
          play_count: number;
          is_published: boolean;
          created_at: string;
        },
        {
          id?: string;
          title: string;
          artist?: string;
          album?: string | null;
          cover_url?: string | null;
          audio_url: string;
          duration_seconds?: number | null;
          track_number?: number | null;
          release_date?: string | null;
          play_count?: number;
          is_published?: boolean;
          created_at?: string;
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
          is_published: boolean;
          published_at: string | null;
          created_at: string;
        },
        {
          id?: string;
          title: string;
          description?: string | null;
          category?: string | null;
          cover_url?: string | null;
          media_url?: string | null;
          is_published?: boolean;
          published_at?: string | null;
          created_at?: string;
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
          created_at: string;
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
          created_at?: string;
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
          sizes: string[];
          category: string | null;
          stock: number;
          is_published: boolean;
          created_at: string;
        },
        {
          id?: string;
          name: string;
          description?: string | null;
          price_cents: number;
          currency?: string;
          images?: string[];
          sizes?: string[];
          category?: string | null;
          stock?: number;
          is_published?: boolean;
          created_at?: string;
        }
      >;
      orders: Table<
        {
          id: string;
          user_id: string;
          status: string;
          total_cents: number;
          shipping_address: Json | null;
          created_at: string;
        },
        {
          id?: string;
          user_id: string;
          status?: string;
          total_cents?: number;
          shipping_address?: Json | null;
          created_at?: string;
        }
      >;
      order_items: Table<
        {
          id: string;
          order_id: string;
          product_id: string;
          quantity: number;
          unit_price_cents: number;
          size: string | null;
        },
        {
          id?: string;
          order_id: string;
          product_id: string;
          quantity?: number;
          unit_price_cents: number;
          size?: string | null;
        }
      >;
    };
    Views: Record<string, never>;
    Functions: Record<string, never>;
    Enums: Record<string, never>;
    CompositeTypes: Record<string, never>;
  };
}
