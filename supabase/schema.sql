-- ============================================================================
-- Tyco schema
--
-- Safe to run repeatedly, including against a database that already has an
-- older version of this file applied — tables are created with
-- `if not exists` and then patched with idempotent `alter table` statements,
-- rather than assuming a truly empty database. The one place that isn't a
-- true no-op migration is order_items.variant_id (see that section) — this
-- assumes no real order data exists yet, which is reasonable pre-launch.
-- ============================================================================

create extension if not exists "pgcrypto";

-- ----------------------------------------------------------------------------
-- admins — the only source of truth for "is this user allowed to publish
-- content". Deliberately its own table with zero client-facing policies:
-- nobody, including an admin, can read or write it through the API, only
-- the service role (which bypasses RLS entirely) can grant/revoke admin.
-- Keeping this off the `profiles` row matters: a self-service "update your
-- own profile" policy on profiles would otherwise let a user grant
-- themselves admin by including is_admin in their own update.
-- ----------------------------------------------------------------------------
create table if not exists public.admins (
  user_id uuid primary key references auth.users (id) on delete cascade,
  created_at timestamptz not null default now()
);

alter table public.admins enable row level security;

create or replace function public.is_admin()
returns boolean
language sql
stable
security definer
set search_path = public
as $$
  select exists (select 1 from public.admins where user_id = auth.uid());
$$;

grant execute on function public.is_admin() to anon, authenticated;

-- ----------------------------------------------------------------------------
-- Shared trigger functions, reused by every publishable/mutable table below.
-- ----------------------------------------------------------------------------
create or replace function public.set_updated_at()
returns trigger
language plpgsql
as $$
begin
  new.updated_at = now();
  return new;
end;
$$;

create or replace function public.set_published_at()
returns trigger
language plpgsql
as $$
begin
  if new.is_published = true
     and coalesce(old.is_published, false) = false
     and new.published_at is null then
    new.published_at = now();
  end if;
  return new;
end;
$$;

-- ----------------------------------------------------------------------------
-- profiles — one row per authenticated user, created automatically on signup
-- ----------------------------------------------------------------------------
create table if not exists public.profiles (
  id uuid primary key references auth.users (id) on delete cascade,
  username text unique,
  display_name text,
  avatar_url text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

alter table public.profiles drop column if exists is_admin;
alter table public.profiles add column if not exists updated_at timestamptz not null default now();

alter table public.profiles drop constraint if exists profiles_username_format;
alter table public.profiles add constraint profiles_username_format
  check (username is null or username ~ '^[a-z0-9_]{3,24}$');

alter table public.profiles enable row level security;

drop policy if exists "profiles are viewable by everyone" on public.profiles;
create policy "profiles are viewable by everyone"
  on public.profiles for select
  using (true);

drop policy if exists "users can update their own profile" on public.profiles;
create policy "users can update their own profile"
  on public.profiles for update
  using (auth.uid() = id)
  with check (auth.uid() = id);

drop trigger if exists set_profiles_updated_at on public.profiles;
create trigger set_profiles_updated_at
  before update on public.profiles
  for each row execute function public.set_updated_at();

-- Auto-create a profile row whenever a new auth user signs up.
create or replace function public.handle_new_user()
returns trigger
language plpgsql
security definer set search_path = public
as $$
begin
  insert into public.profiles (id, display_name)
  values (new.id, coalesce(new.raw_user_meta_data ->> 'display_name', split_part(new.email, '@', 1)));
  return new;
end;
$$;

drop trigger if exists on_auth_user_created on auth.users;
create trigger on_auth_user_created
  after insert on auth.users
  for each row execute procedure public.handle_new_user();

-- ----------------------------------------------------------------------------
-- artists — the roster. A real entity (not free text) since Tyco can
-- release music on behalf of more than one act.
-- ----------------------------------------------------------------------------
create table if not exists public.artists (
  id uuid primary key default gen_random_uuid(),
  name text not null,
  bio text,
  photo_url text,
  video_url text,
  is_published boolean not null default false,
  published_at timestamptz,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

alter table public.artists add column if not exists video_url text;

alter table public.artists enable row level security;

drop policy if exists "published artists are public" on public.artists;
create policy "published artists are public"
  on public.artists for select
  using (is_published = true);

drop policy if exists "admins manage artists" on public.artists;
create policy "admins manage artists"
  on public.artists for all
  using (public.is_admin())
  with check (public.is_admin());

drop trigger if exists set_artists_updated_at on public.artists;
create trigger set_artists_updated_at
  before update on public.artists
  for each row execute function public.set_updated_at();

drop trigger if exists set_artists_published_at on public.artists;
create trigger set_artists_published_at
  before insert or update on public.artists
  for each row execute function public.set_published_at();

create index if not exists artists_published_idx on public.artists (is_published);

-- ----------------------------------------------------------------------------
-- albums — a real entity rather than free text on tracks, so releases can
-- carry their own cover art, release date, and track ordering.
-- ----------------------------------------------------------------------------
create table if not exists public.albums (
  id uuid primary key default gen_random_uuid(),
  title text not null,
  artist_id uuid references public.artists (id) on delete set null,
  cover_url text,
  release_date date,
  is_published boolean not null default false,
  published_at timestamptz,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

alter table public.albums add column if not exists artist_id uuid references public.artists (id) on delete set null;

alter table public.albums enable row level security;

drop policy if exists "published albums are public" on public.albums;
create policy "published albums are public"
  on public.albums for select
  using (is_published = true);

drop policy if exists "admins manage albums" on public.albums;
create policy "admins manage albums"
  on public.albums for all
  using (public.is_admin())
  with check (public.is_admin());

drop trigger if exists set_albums_updated_at on public.albums;
create trigger set_albums_updated_at
  before update on public.albums
  for each row execute function public.set_updated_at();

drop trigger if exists set_albums_published_at on public.albums;
create trigger set_albums_published_at
  before insert or update on public.albums
  for each row execute function public.set_published_at();

create index if not exists albums_published_release_date_idx
  on public.albums (is_published, release_date desc);
create index if not exists albums_artist_id_idx on public.albums (artist_id);

-- ----------------------------------------------------------------------------
-- tracks — the free music catalogue. album_id is nullable: singles don't
-- need an album.
-- ----------------------------------------------------------------------------
create table if not exists public.tracks (
  id uuid primary key default gen_random_uuid(),
  title text not null,
  artist_id uuid references public.artists (id) on delete set null,
  album_id uuid references public.albums (id) on delete set null,
  cover_url text,
  audio_url text not null,
  duration_seconds integer,
  track_number integer,
  release_date date,
  genre text,
  play_count bigint not null default 0,
  is_published boolean not null default false,
  published_at timestamptz,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

-- Migrates the old free-text `artist` column to artist_id. Assumes no real
-- track data predates this — reasonable pre-launch (same caveat as the
-- order_items.variant_id migration earlier).
alter table public.tracks drop column if exists album;
alter table public.tracks drop column if exists artist;
alter table public.tracks add column if not exists artist_id uuid references public.artists (id) on delete set null;
alter table public.tracks add column if not exists album_id uuid references public.albums (id) on delete set null;
alter table public.tracks add column if not exists published_at timestamptz;
alter table public.tracks add column if not exists updated_at timestamptz not null default now();
alter table public.tracks add column if not exists genre text;

alter table public.tracks drop constraint if exists tracks_duration_positive;
alter table public.tracks add constraint tracks_duration_positive
  check (duration_seconds is null or duration_seconds > 0);

alter table public.tracks drop constraint if exists tracks_track_number_positive;
alter table public.tracks add constraint tracks_track_number_positive
  check (track_number is null or track_number > 0);

alter table public.tracks drop constraint if exists tracks_play_count_non_negative;
alter table public.tracks add constraint tracks_play_count_non_negative
  check (play_count >= 0);

drop index if exists public.tracks_album_track_number_key;
create unique index tracks_album_track_number_key
  on public.tracks (album_id, track_number)
  where album_id is not null and track_number is not null;

alter table public.tracks enable row level security;

drop policy if exists "published tracks are public" on public.tracks;
create policy "published tracks are public"
  on public.tracks for select
  using (is_published = true);

drop policy if exists "admins manage tracks" on public.tracks;
create policy "admins manage tracks"
  on public.tracks for all
  using (public.is_admin())
  with check (public.is_admin());

drop trigger if exists set_tracks_updated_at on public.tracks;
create trigger set_tracks_updated_at
  before update on public.tracks
  for each row execute function public.set_updated_at();

drop trigger if exists set_tracks_published_at on public.tracks;
create trigger set_tracks_published_at
  before insert or update on public.tracks
  for each row execute function public.set_published_at();

create index if not exists tracks_published_release_date_idx
  on public.tracks (is_published, release_date desc);
create index if not exists tracks_album_id_idx on public.tracks (album_id);
create index if not exists tracks_artist_id_idx on public.tracks (artist_id);
create index if not exists tracks_genre_idx on public.tracks (genre) where genre is not null;

-- Lets the player bump play_count without granting raw UPDATE on tracks to
-- anon/authenticated clients.
create or replace function public.increment_play_count(track_id uuid)
returns void
language sql
security definer
set search_path = public
as $$
  update public.tracks set play_count = play_count + 1
  where id = track_id and is_published = true;
$$;

grant execute on function public.increment_play_count(uuid) to anon, authenticated;

-- ----------------------------------------------------------------------------
-- track_likes — a signed-in listener's saved tracks ("Liked Songs"). Purely
-- user-owned: no admin policy needed, nobody manages this on anyone's behalf.
-- ----------------------------------------------------------------------------
create table if not exists public.track_likes (
  user_id uuid not null references auth.users (id) on delete cascade,
  track_id uuid not null references public.tracks (id) on delete cascade,
  created_at timestamptz not null default now(),
  primary key (user_id, track_id)
);

alter table public.track_likes enable row level security;

drop policy if exists "users manage their own likes" on public.track_likes;
create policy "users manage their own likes"
  on public.track_likes for all
  using (auth.uid() = user_id)
  with check (auth.uid() = user_id);

create index if not exists track_likes_user_id_idx on public.track_likes (user_id);
create index if not exists track_likes_track_id_idx on public.track_likes (track_id);

-- ----------------------------------------------------------------------------
-- artist_follows — a signed-in listener's followed artists. Same shape and
-- ownership model as track_likes.
-- ----------------------------------------------------------------------------
create table if not exists public.artist_follows (
  user_id uuid not null references auth.users (id) on delete cascade,
  artist_id uuid not null references public.artists (id) on delete cascade,
  created_at timestamptz not null default now(),
  primary key (user_id, artist_id)
);

alter table public.artist_follows enable row level security;

drop policy if exists "users manage their own follows" on public.artist_follows;
create policy "users manage their own follows"
  on public.artist_follows for all
  using (auth.uid() = user_id)
  with check (auth.uid() = user_id);

create index if not exists artist_follows_user_id_idx on public.artist_follows (user_id);
create index if not exists artist_follows_artist_id_idx on public.artist_follows (artist_id);

-- ----------------------------------------------------------------------------
-- playlists / playlist_tracks — a signed-in listener's own playlists.
-- Private by nature (no "public playlist" concept yet): every operation is
-- scoped to auth.uid() = user_id, either directly on playlists or via the
-- owning playlist for playlist_tracks. No admin policy — nobody manages a
-- listener's playlist on their behalf.
-- ----------------------------------------------------------------------------
create table if not exists public.playlists (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users (id) on delete cascade,
  name text not null,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

alter table public.playlists enable row level security;

drop policy if exists "users manage their own playlists" on public.playlists;
create policy "users manage their own playlists"
  on public.playlists for all
  using (auth.uid() = user_id)
  with check (auth.uid() = user_id);

drop trigger if exists set_playlists_updated_at on public.playlists;
create trigger set_playlists_updated_at
  before update on public.playlists
  for each row execute function public.set_updated_at();

create index if not exists playlists_user_id_idx on public.playlists (user_id);

create table if not exists public.playlist_tracks (
  playlist_id uuid not null references public.playlists (id) on delete cascade,
  track_id uuid not null references public.tracks (id) on delete cascade,
  position integer not null default 0,
  added_at timestamptz not null default now(),
  primary key (playlist_id, track_id)
);

alter table public.playlist_tracks enable row level security;

drop policy if exists "users manage tracks on their own playlists" on public.playlist_tracks;
create policy "users manage tracks on their own playlists"
  on public.playlist_tracks for all
  using (
    exists (
      select 1 from public.playlists
      where playlists.id = playlist_tracks.playlist_id
      and playlists.user_id = auth.uid()
    )
  )
  with check (
    exists (
      select 1 from public.playlists
      where playlists.id = playlist_tracks.playlist_id
      and playlists.user_id = auth.uid()
    )
  );

create index if not exists playlist_tracks_playlist_id_idx on public.playlist_tracks (playlist_id);
create index if not exists playlist_tracks_track_id_idx on public.playlist_tracks (track_id);

-- ----------------------------------------------------------------------------
-- portfolio_items — creative work & studio updates
-- ----------------------------------------------------------------------------
create table if not exists public.portfolio_items (
  id uuid primary key default gen_random_uuid(),
  title text not null,
  description text,
  category text,
  cover_url text,
  media_url text,
  media_type text,
  images text[] not null default '{}',
  is_published boolean not null default false,
  published_at timestamptz,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

alter table public.portfolio_items add column if not exists media_type text;
alter table public.portfolio_items add column if not exists images text[] not null default '{}';
alter table public.portfolio_items add column if not exists updated_at timestamptz not null default now();

alter table public.portfolio_items drop constraint if exists portfolio_items_media_type_check;
alter table public.portfolio_items add constraint portfolio_items_media_type_check
  check (media_type is null or media_type in ('image', 'video'));

alter table public.portfolio_items enable row level security;

drop policy if exists "published portfolio items are public" on public.portfolio_items;
create policy "published portfolio items are public"
  on public.portfolio_items for select
  using (is_published = true);

drop policy if exists "admins manage portfolio items" on public.portfolio_items;
create policy "admins manage portfolio items"
  on public.portfolio_items for all
  using (public.is_admin())
  with check (public.is_admin());

drop trigger if exists set_portfolio_items_updated_at on public.portfolio_items;
create trigger set_portfolio_items_updated_at
  before update on public.portfolio_items
  for each row execute function public.set_updated_at();

drop trigger if exists set_portfolio_items_published_at on public.portfolio_items;
create trigger set_portfolio_items_published_at
  before insert or update on public.portfolio_items
  for each row execute function public.set_published_at();

create index if not exists portfolio_items_published_idx
  on public.portfolio_items (is_published, published_at desc);

-- ----------------------------------------------------------------------------
-- events — past & upcoming. "Past" vs "upcoming" is derived from event_date
-- at query time rather than stored, so it can never drift out of sync.
-- ----------------------------------------------------------------------------
create table if not exists public.events (
  id uuid primary key default gen_random_uuid(),
  title text not null,
  description text,
  location text,
  event_date timestamptz not null,
  cover_url text,
  ticket_url text,
  is_published boolean not null default false,
  published_at timestamptz,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

alter table public.events add column if not exists published_at timestamptz;
alter table public.events add column if not exists updated_at timestamptz not null default now();

alter table public.events enable row level security;

drop policy if exists "published events are public" on public.events;
create policy "published events are public"
  on public.events for select
  using (is_published = true);

drop policy if exists "admins manage events" on public.events;
create policy "admins manage events"
  on public.events for all
  using (public.is_admin())
  with check (public.is_admin());

drop trigger if exists set_events_updated_at on public.events;
create trigger set_events_updated_at
  before update on public.events
  for each row execute function public.set_updated_at();

drop trigger if exists set_events_published_at on public.events;
create trigger set_events_published_at
  before insert or update on public.events
  for each row execute function public.set_published_at();

create index if not exists events_published_event_date_idx
  on public.events (is_published, event_date);

-- ----------------------------------------------------------------------------
-- products — the retail shop. Stock lives on product_variants, not here:
-- a clothing store needs to know Medium is out and Large isn't.
-- ----------------------------------------------------------------------------
create table if not exists public.products (
  id uuid primary key default gen_random_uuid(),
  name text not null,
  description text,
  price_cents integer not null,
  currency text not null default 'usd',
  images text[] not null default '{}',
  category text,
  is_published boolean not null default false,
  published_at timestamptz,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

alter table public.products drop column if exists sizes;
alter table public.products drop column if exists stock;
alter table public.products add column if not exists published_at timestamptz;
alter table public.products add column if not exists updated_at timestamptz not null default now();

alter table public.products drop constraint if exists products_price_non_negative;
alter table public.products add constraint products_price_non_negative
  check (price_cents >= 0);

alter table public.products enable row level security;

drop policy if exists "published products are public" on public.products;
create policy "published products are public"
  on public.products for select
  using (is_published = true);

drop policy if exists "admins manage products" on public.products;
create policy "admins manage products"
  on public.products for all
  using (public.is_admin())
  with check (public.is_admin());

drop trigger if exists set_products_updated_at on public.products;
create trigger set_products_updated_at
  before update on public.products
  for each row execute function public.set_updated_at();

drop trigger if exists set_products_published_at on public.products;
create trigger set_products_published_at
  before insert or update on public.products
  for each row execute function public.set_published_at();

create index if not exists products_published_created_at_idx
  on public.products (is_published, created_at desc);
create index if not exists products_category_idx on public.products (category);

-- ----------------------------------------------------------------------------
-- product_variants — one row per product + size, each with its own stock.
-- A one-size product still gets a single variant row (e.g. size = 'One
-- Size') so stock always has exactly one source of truth.
-- ----------------------------------------------------------------------------
create table if not exists public.product_variants (
  id uuid primary key default gen_random_uuid(),
  product_id uuid not null references public.products (id) on delete cascade,
  size text not null,
  sku text,
  stock integer not null default 0,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

alter table public.product_variants drop constraint if exists product_variants_stock_non_negative;
alter table public.product_variants add constraint product_variants_stock_non_negative
  check (stock >= 0);

alter table public.product_variants drop constraint if exists product_variants_product_size_key;
alter table public.product_variants add constraint product_variants_product_size_key
  unique (product_id, size);

alter table public.product_variants enable row level security;

drop policy if exists "variants of published products are public" on public.product_variants;
create policy "variants of published products are public"
  on public.product_variants for select
  using (
    exists (
      select 1 from public.products
      where products.id = product_variants.product_id
      and products.is_published = true
    )
  );

drop policy if exists "admins manage product variants" on public.product_variants;
create policy "admins manage product variants"
  on public.product_variants for all
  using (public.is_admin())
  with check (public.is_admin());

drop trigger if exists set_product_variants_updated_at on public.product_variants;
create trigger set_product_variants_updated_at
  before update on public.product_variants
  for each row execute function public.set_updated_at();

create index if not exists product_variants_product_id_idx on public.product_variants (product_id);

-- decrement_variant_stock — called only from the checkout webhook handler
-- (service role) once a payment is confirmed. Clamps at zero so a retried
-- webhook delivery can never oversell into negative stock.
create or replace function public.decrement_variant_stock(p_variant_id uuid, p_quantity integer)
returns void
language sql
security definer
set search_path = public
as $$
  update public.product_variants
  set stock = greatest(0, stock - p_quantity)
  where id = p_variant_id;
$$;

grant execute on function public.decrement_variant_stock(uuid, integer) to service_role;

-- ----------------------------------------------------------------------------
-- orders — status transitions (pending -> paid -> fulfilled -> ...) are a
-- service-role/webhook concern. Customers may only ever SELECT/INSERT their
-- own orders, never UPDATE or DELETE them — otherwise a signed-in customer
-- could mark their own order "paid" from the browser without paying.
--
-- user_id is nullable and ON DELETE SET NULL rather than CASCADE: deleting a
-- user account (e.g. from the admin panel) should not erase sales records.
-- customer_email is captured at order time so an order stays identifiable
-- even after the account behind it is gone, and so the admin orders view
-- doesn't need service-role access just to show who ordered something.
-- ----------------------------------------------------------------------------
create table if not exists public.orders (
  id uuid primary key default gen_random_uuid(),
  user_id uuid references auth.users (id) on delete set null,
  customer_email text,
  status text not null default 'pending',
  currency text not null default 'usd',
  total_cents integer not null default 0,
  shipping_address jsonb,
  stripe_payment_intent_id text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

alter table public.orders add column if not exists customer_email text;
alter table public.orders add column if not exists currency text not null default 'usd';
alter table public.orders add column if not exists stripe_payment_intent_id text;
alter table public.orders add column if not exists revolut_order_id text;
alter table public.orders add column if not exists updated_at timestamptz not null default now();

create unique index if not exists orders_revolut_order_id_idx
  on public.orders (revolut_order_id) where revolut_order_id is not null;

alter table public.orders alter column user_id drop not null;

alter table public.orders drop constraint if exists orders_user_id_fkey;
alter table public.orders add constraint orders_user_id_fkey
  foreign key (user_id) references auth.users (id) on delete set null;

alter table public.orders drop constraint if exists orders_status_check;
alter table public.orders add constraint orders_status_check
  check (status in ('pending', 'paid', 'fulfilled', 'cancelled', 'refunded'));

alter table public.orders drop constraint if exists orders_total_non_negative;
alter table public.orders add constraint orders_total_non_negative
  check (total_cents >= 0);

alter table public.orders enable row level security;

drop policy if exists "users manage their own orders" on public.orders;

drop policy if exists "customers view their own orders" on public.orders;
create policy "customers view their own orders"
  on public.orders for select
  using (auth.uid() = user_id);

drop policy if exists "customers create their own orders" on public.orders;
create policy "customers create their own orders"
  on public.orders for insert
  with check (auth.uid() = user_id and status = 'pending');

drop policy if exists "admins manage all orders" on public.orders;
create policy "admins manage all orders"
  on public.orders for all
  using (public.is_admin())
  with check (public.is_admin());

drop trigger if exists set_orders_updated_at on public.orders;
create trigger set_orders_updated_at
  before update on public.orders
  for each row execute function public.set_updated_at();

create index if not exists orders_user_id_idx on public.orders (user_id);
create index if not exists orders_status_idx on public.orders (status);

-- ----------------------------------------------------------------------------
-- order_items — line items reference a specific product_variant (so the
-- size ordered is unambiguous), and unit_price_cents is captured at order
-- time so a later price change never rewrites history. Immutable once
-- created: customers can insert while their order is still "pending", but
-- can never update or delete a line item afterward.
--
-- NOTE: this migrates product_id + size (old shape) to variant_id (new
-- shape). It assumes no real order rows exist yet — reasonable pre-launch,
-- but back up first if that's ever not true.
-- ----------------------------------------------------------------------------
create table if not exists public.order_items (
  id uuid primary key default gen_random_uuid(),
  order_id uuid not null references public.orders (id) on delete cascade,
  variant_id uuid not null references public.product_variants (id),
  quantity integer not null default 1,
  unit_price_cents integer not null,
  created_at timestamptz not null default now()
);

alter table public.order_items drop column if exists product_id;
alter table public.order_items drop column if exists size;
alter table public.order_items add column if not exists variant_id uuid references public.product_variants (id);
alter table public.order_items add column if not exists created_at timestamptz not null default now();

alter table public.order_items drop constraint if exists order_items_quantity_positive;
alter table public.order_items add constraint order_items_quantity_positive
  check (quantity > 0);

alter table public.order_items drop constraint if exists order_items_price_non_negative;
alter table public.order_items add constraint order_items_price_non_negative
  check (unit_price_cents >= 0);

alter table public.order_items enable row level security;

drop policy if exists "users manage items on their own orders" on public.order_items;

drop policy if exists "customers view items on their own orders" on public.order_items;
create policy "customers view items on their own orders"
  on public.order_items for select
  using (
    exists (
      select 1 from public.orders
      where orders.id = order_items.order_id
      and orders.user_id = auth.uid()
    )
  );

drop policy if exists "customers add items to their own pending orders" on public.order_items;
create policy "customers add items to their own pending orders"
  on public.order_items for insert
  with check (
    exists (
      select 1 from public.orders
      where orders.id = order_items.order_id
      and orders.user_id = auth.uid()
      and orders.status = 'pending'
    )
  );

drop policy if exists "admins manage all order items" on public.order_items;
create policy "admins manage all order items"
  on public.order_items for all
  using (public.is_admin())
  with check (public.is_admin());

create index if not exists order_items_order_id_idx on public.order_items (order_id);
create index if not exists order_items_variant_id_idx on public.order_items (variant_id);

-- ----------------------------------------------------------------------------
-- site_settings — a single row of homepage content the admin can edit
-- without a deploy: the next-project teaser and the mission fund progress
-- bar. Singleton by construction (id is always `true`), so there's never
-- an ambiguous "which row" to query.
-- ----------------------------------------------------------------------------
create table if not exists public.site_settings (
  id boolean primary key default true,
  next_project_title text,
  next_project_body text,
  next_project_image_url text,
  mission_raised_cents integer not null default 0,
  mission_goal_cents integer not null default 0,
  updated_at timestamptz not null default now(),
  constraint site_settings_singleton check (id)
);

insert into public.site_settings (id)
values (true)
on conflict (id) do nothing;

alter table public.site_settings drop constraint if exists site_settings_raised_non_negative;
alter table public.site_settings add constraint site_settings_raised_non_negative
  check (mission_raised_cents >= 0);

alter table public.site_settings drop constraint if exists site_settings_goal_non_negative;
alter table public.site_settings add constraint site_settings_goal_non_negative
  check (mission_goal_cents >= 0);

alter table public.site_settings enable row level security;

drop policy if exists "site settings are public" on public.site_settings;
create policy "site settings are public"
  on public.site_settings for select
  using (true);

drop policy if exists "admins manage site settings" on public.site_settings;
create policy "admins manage site settings"
  on public.site_settings for all
  using (public.is_admin())
  with check (public.is_admin());

drop trigger if exists set_site_settings_updated_at on public.site_settings;
create trigger set_site_settings_updated_at
  before update on public.site_settings
  for each row execute function public.set_updated_at();

-- ----------------------------------------------------------------------------
-- Storage buckets referenced by the app, plus the RLS policies storage.objects
-- actually needs — creating a public bucket alone does not grant upload
-- access; without an explicit policy nothing (not even a future admin
-- panel) could write to these buckets.
-- ----------------------------------------------------------------------------
insert into storage.buckets (id, name, public)
values
  ('tracks', 'tracks', true),
  ('covers', 'covers', true),
  ('portfolio', 'portfolio', true),
  ('products', 'products', true),
  ('artists', 'artists', true)
on conflict (id) do nothing;

drop policy if exists "public read for tyco buckets" on storage.objects;
create policy "public read for tyco buckets"
  on storage.objects for select
  using (bucket_id in ('tracks', 'covers', 'portfolio', 'products', 'artists'));

drop policy if exists "admins manage tyco bucket objects" on storage.objects;
create policy "admins manage tyco bucket objects"
  on storage.objects for all
  using (bucket_id in ('tracks', 'covers', 'portfolio', 'products', 'artists') and public.is_admin())
  with check (bucket_id in ('tracks', 'covers', 'portfolio', 'products', 'artists') and public.is_admin());
