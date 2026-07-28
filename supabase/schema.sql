-- ============================================================================
-- Tyco foundation schema
-- Run this once in the Supabase SQL editor (or via `supabase db push`)
-- against a fresh project. Safe to re-run: every statement is idempotent.
-- ============================================================================

create extension if not exists "pgcrypto";

-- ----------------------------------------------------------------------------
-- profiles — one row per authenticated user, created automatically on signup
-- ----------------------------------------------------------------------------
create table if not exists public.profiles (
  id uuid primary key references auth.users (id) on delete cascade,
  username text unique,
  display_name text,
  avatar_url text,
  is_admin boolean not null default false,
  created_at timestamptz not null default now()
);

alter table public.profiles enable row level security;

drop policy if exists "profiles are viewable by everyone" on public.profiles;
create policy "profiles are viewable by everyone"
  on public.profiles for select
  using (true);

drop policy if exists "users can update their own profile" on public.profiles;
create policy "users can update their own profile"
  on public.profiles for update
  using (auth.uid() = id);

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
-- tracks — the free music catalogue
-- ----------------------------------------------------------------------------
create table if not exists public.tracks (
  id uuid primary key default gen_random_uuid(),
  title text not null,
  artist text not null default 'Tyco',
  album text,
  cover_url text,
  audio_url text not null,
  duration_seconds integer,
  track_number integer,
  release_date date,
  play_count bigint not null default 0,
  is_published boolean not null default false,
  created_at timestamptz not null default now()
);

alter table public.tracks enable row level security;

drop policy if exists "published tracks are public" on public.tracks;
create policy "published tracks are public"
  on public.tracks for select
  using (is_published = true);

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
  is_published boolean not null default false,
  published_at timestamptz,
  created_at timestamptz not null default now()
);

alter table public.portfolio_items enable row level security;

drop policy if exists "published portfolio items are public" on public.portfolio_items;
create policy "published portfolio items are public"
  on public.portfolio_items for select
  using (is_published = true);

-- ----------------------------------------------------------------------------
-- events — past & upcoming
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
  created_at timestamptz not null default now()
);

alter table public.events enable row level security;

drop policy if exists "published events are public" on public.events;
create policy "published events are public"
  on public.events for select
  using (is_published = true);

-- ----------------------------------------------------------------------------
-- products — the retail shop
-- ----------------------------------------------------------------------------
create table if not exists public.products (
  id uuid primary key default gen_random_uuid(),
  name text not null,
  description text,
  price_cents integer not null,
  currency text not null default 'usd',
  images text[] not null default '{}',
  sizes text[] not null default '{}',
  category text,
  stock integer not null default 0,
  is_published boolean not null default false,
  created_at timestamptz not null default now()
);

alter table public.products enable row level security;

drop policy if exists "published products are public" on public.products;
create policy "published products are public"
  on public.products for select
  using (is_published = true);

-- ----------------------------------------------------------------------------
-- orders & order_items — retail checkout
-- ----------------------------------------------------------------------------
create table if not exists public.orders (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users (id) on delete cascade,
  status text not null default 'pending',
  total_cents integer not null default 0,
  shipping_address jsonb,
  created_at timestamptz not null default now()
);

alter table public.orders enable row level security;

drop policy if exists "users manage their own orders" on public.orders;
create policy "users manage their own orders"
  on public.orders for all
  using (auth.uid() = user_id)
  with check (auth.uid() = user_id);

create table if not exists public.order_items (
  id uuid primary key default gen_random_uuid(),
  order_id uuid not null references public.orders (id) on delete cascade,
  product_id uuid not null references public.products (id),
  quantity integer not null default 1,
  unit_price_cents integer not null,
  size text
);

alter table public.order_items enable row level security;

drop policy if exists "users manage items on their own orders" on public.order_items;
create policy "users manage items on their own orders"
  on public.order_items for all
  using (
    exists (
      select 1 from public.orders
      where orders.id = order_items.order_id
      and orders.user_id = auth.uid()
    )
  )
  with check (
    exists (
      select 1 from public.orders
      where orders.id = order_items.order_id
      and orders.user_id = auth.uid()
    )
  );

-- ----------------------------------------------------------------------------
-- Storage buckets referenced by the app (create once, public read).
-- Run separately if `storage.buckets` insert is restricted on your plan —
-- these can also be created from the Supabase Dashboard under Storage.
-- ----------------------------------------------------------------------------
insert into storage.buckets (id, name, public)
values
  ('tracks', 'tracks', true),
  ('covers', 'covers', true),
  ('portfolio', 'portfolio', true),
  ('products', 'products', true)
on conflict (id) do nothing;
