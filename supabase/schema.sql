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
-- Music feature removal — the app no longer has a music tab, so the entire
-- catalogue/listener-state schema behind it (artists, albums, tracks, likes,
-- follows, playlists) is dropped. Explicit drops rather than just deleting
-- the old `create table` blocks, since this file is re-run against
-- databases that already have these tables from before removal.
-- ----------------------------------------------------------------------------
drop table if exists public.playlist_tracks cascade;
drop table if exists public.playlists cascade;
drop table if exists public.artist_follows cascade;
drop table if exists public.track_likes cascade;
drop function if exists public.increment_play_count(uuid);
drop table if exists public.tracks cascade;
drop table if exists public.albums cascade;
drop table if exists public.artists cascade;

-- ----------------------------------------------------------------------------
-- Creators feature removal — no more roster/page, so the entire schema
-- behind it (profiles, works, admin notes) is dropped. The products.creator_id
-- link is dropped separately, below, after products is created. Explicit
-- drops rather than just deleting the old `create table` blocks, same
-- reasoning as the music removal above.
-- ----------------------------------------------------------------------------
drop table if exists public.creator_works cascade;
drop table if exists public.creator_admin_notes cascade;
drop table if exists public.creators cascade;

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
  organizer text,
  event_date timestamptz not null,
  cover_url text,
  cover_video_url text,
  ticket_url text,
  is_published boolean not null default false,
  published_at timestamptz,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

alter table public.events add column if not exists published_at timestamptz;
alter table public.events add column if not exists organizer text;
alter table public.events add column if not exists cover_video_url text;
alter table public.events add column if not exists updated_at timestamptz not null default now();

-- Ticketing. price_cents = 0 means free entry (still requires "buying" a
-- zero-cost ticket so capacity/check-in tracking still works). capacity is
-- the admin-set cap set when creating the event; capacity_remaining is the
-- live decrementing counter — same relationship as products.stock vs
-- product_variants, and decremented on the same "only once actually paid"
-- schedule, for the same reason (a pending, unpaid cart shouldn't lock out
-- other buyers).
alter table public.events add column if not exists price_cents integer not null default 0;
alter table public.events add column if not exists currency text not null default 'usd';
alter table public.events add column if not exists capacity integer;
alter table public.events add column if not exists capacity_remaining integer;

alter table public.events drop constraint if exists events_price_non_negative;
alter table public.events add constraint events_price_non_negative
  check (price_cents >= 0);

alter table public.events drop constraint if exists events_capacity_non_negative;
alter table public.events add constraint events_capacity_non_negative
  check (capacity is null or capacity >= 0);

-- Keeps capacity_remaining aligned whenever an admin sets/changes capacity,
-- without discarding tickets already sold: applies just the delta of the
-- capacity change rather than resetting to the new value outright, so
-- editing an event's other fields (which resubmits the same capacity every
-- time) doesn't refill sold-out inventory.
create or replace function public.sync_event_capacity_remaining()
returns trigger
language plpgsql
as $$
begin
  if tg_op = 'INSERT' then
    new.capacity_remaining := new.capacity;
  elsif new.capacity is null then
    new.capacity_remaining := null;
  elsif old.capacity is null or new.capacity is distinct from old.capacity then
    new.capacity_remaining := greatest(
      0,
      coalesce(old.capacity_remaining, old.capacity, new.capacity) + (new.capacity - coalesce(old.capacity, new.capacity))
    );
  end if;
  return new;
end;
$$;

drop trigger if exists sync_event_capacity_remaining on public.events;
create trigger sync_event_capacity_remaining
  before insert or update on public.events
  for each row execute function public.sync_event_capacity_remaining();

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
-- event_tickets — one row per purchase (not per attendee: a single ticket
-- row can cover several pax, matching "select number of pax, buy one
-- ticket" rather than a ticket-per-person model). Requires a signed-in
-- buyer — unlike shop orders, a ticket only means something tied to an
-- account, since that's how the buyer proves it at the door and how staff
-- find it to check them in. reference_code is the short human-readable
-- code shown on the ticket and looked up by door staff; status transitions
-- (pending -> paid -> ...) are a service-role/webhook concern, same as
-- orders, and check-in is an admin-only action, never the buyer's own.
-- ----------------------------------------------------------------------------
create table if not exists public.event_tickets (
  id uuid primary key default gen_random_uuid(),
  event_id uuid not null references public.events (id) on delete cascade,
  user_id uuid not null references auth.users (id) on delete cascade,
  quantity integer not null default 1,
  unit_price_cents integer not null,
  total_cents integer not null,
  currency text not null default 'usd',
  status text not null default 'pending',
  revolut_order_id text,
  reference_code text not null default upper(substr(replace(gen_random_uuid()::text, '-', ''), 1, 8)),
  checked_in_at timestamptz,
  checked_in_by uuid references auth.users (id) on delete set null,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

alter table public.event_tickets drop constraint if exists event_tickets_quantity_positive;
alter table public.event_tickets add constraint event_tickets_quantity_positive
  check (quantity > 0);

alter table public.event_tickets drop constraint if exists event_tickets_prices_non_negative;
alter table public.event_tickets add constraint event_tickets_prices_non_negative
  check (unit_price_cents >= 0 and total_cents >= 0);

alter table public.event_tickets drop constraint if exists event_tickets_status_check;
alter table public.event_tickets add constraint event_tickets_status_check
  check (status in ('pending', 'paid', 'cancelled', 'refunded'));

alter table public.event_tickets drop constraint if exists event_tickets_reference_code_key;
alter table public.event_tickets add constraint event_tickets_reference_code_key unique (reference_code);

alter table public.event_tickets enable row level security;

drop policy if exists "buyers see their own tickets" on public.event_tickets;
create policy "buyers see their own tickets"
  on public.event_tickets for select
  using (auth.uid() = user_id);

drop policy if exists "buyers create their own tickets" on public.event_tickets;
create policy "buyers create their own tickets"
  on public.event_tickets for insert
  with check (auth.uid() = user_id);

drop policy if exists "admins manage event tickets" on public.event_tickets;
create policy "admins manage event tickets"
  on public.event_tickets for all
  using (public.is_admin())
  with check (public.is_admin());

drop trigger if exists set_event_tickets_updated_at on public.event_tickets;
create trigger set_event_tickets_updated_at
  before update on public.event_tickets
  for each row execute function public.set_updated_at();

create index if not exists event_tickets_event_id_idx on public.event_tickets (event_id);
create index if not exists event_tickets_user_id_idx on public.event_tickets (user_id);
create index if not exists event_tickets_reference_code_idx on public.event_tickets (reference_code);

-- decrement_event_capacity — called only from the checkout webhook handler
-- (service role) once a ticket payment is confirmed. Clamps at zero and is
-- a no-op when the event has no capacity limit set, same tolerance as
-- decrement_variant_stock below.
create or replace function public.decrement_event_capacity(p_event_id uuid, p_quantity integer)
returns void
language sql
security definer
set search_path = public
as $$
  update public.events
  set capacity_remaining = greatest(0, capacity_remaining - p_quantity)
  where id = p_event_id and capacity_remaining is not null;
$$;

grant execute on function public.decrement_event_capacity(uuid, integer) to service_role;

-- check_in_ticket — the one and only way a ticket's checked_in_at gets
-- set. Admin-only (matches the event_tickets RLS policy above), and
-- refuses a ticket that's already checked in rather than silently
-- overwriting the original check-in time/admin, so re-scanning a used
-- ticket surfaces as an error instead of quietly resetting it.
create or replace function public.check_in_ticket(p_ticket_id uuid)
returns public.event_tickets
language plpgsql
security definer
set search_path = public
as $$
declare
  v_ticket public.event_tickets;
begin
  if not public.is_admin() then
    raise exception 'Not authorized';
  end if;

  select * into v_ticket from public.event_tickets where id = p_ticket_id for update;

  if v_ticket.id is null then
    raise exception 'Ticket not found';
  end if;

  if v_ticket.status != 'paid' then
    raise exception 'Ticket is not paid';
  end if;

  if v_ticket.checked_in_at is not null then
    raise exception 'Ticket already checked in';
  end if;

  update public.event_tickets
  set checked_in_at = now(), checked_in_by = auth.uid()
  where id = p_ticket_id
  returning * into v_ticket;

  return v_ticket;
end;
$$;

grant execute on function public.check_in_ticket(uuid) to authenticated;

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
alter table public.products drop column if exists creator_id;
alter table public.products add column if not exists published_at timestamptz;
alter table public.products add column if not exists updated_at timestamptz not null default now();
alter table public.products add column if not exists is_featured boolean not null default false;

create index if not exists products_featured_idx on public.products (is_featured) where is_featured = true;

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
-- Merchize fulfilment — once an order is marked "paid" (by the Revolut
-- webhook), the same handler creates a fulfilment order at Merchize, a
-- print-on-demand/dropship partner. merchize_order_id round-trips the same
-- way revolut_order_id does; merchize_status carries their raw status string
-- (informational — the constrained `orders.status` only ever gets bumped to
-- 'fulfilled' once Merchize actually reports a shipment, so existing status-
-- based UI/logic elsewhere in the app doesn't need to change). tracking_*
-- are populated by their webhook once a shipment goes out.
--
-- merchize_variant_code on product_variants is the size-specific variant/SKU
-- code from the Merchize product catalog — set per size from the admin
-- product form. Required for a variant to be fulfillable; an order containing
-- a variant with no code set will fail at the Merchize API call (logged, not
-- silently dropped — see src/app/api/webhooks/revolut/route.ts).
-- ----------------------------------------------------------------------------
alter table public.orders add column if not exists merchize_order_id text;
alter table public.orders add column if not exists merchize_status text;
alter table public.orders add column if not exists tracking_number text;
alter table public.orders add column if not exists tracking_url text;

-- merchize_item_summary holds the matched catalog item's title/variant from
-- an on-demand "Check Merchize status" lookup (order-detail API) — the only
-- easy way to confirm from the admin an order actually linked to the
-- right existing catalog product instead of a new one.
alter table public.orders add column if not exists merchize_item_summary text;

create index if not exists orders_merchize_order_id_idx
  on public.orders (merchize_order_id) where merchize_order_id is not null;

alter table public.product_variants add column if not exists merchize_variant_code text;

-- ----------------------------------------------------------------------------
-- site_settings — a single row of homepage content the admin can edit
-- without a deploy: the next-project teaser, the mission fund progress
-- (raised/goal cents plus a short editorial blurb on what's currently
-- being funded), and the front-page "who we are" slideshow (about_gallery
-- — an ordered jsonb array of {url, type} where type is "image" or "video").
-- Singleton by construction (id is always `true`), so there's never an
-- ambiguous "which row" to query.
-- ----------------------------------------------------------------------------
create table if not exists public.site_settings (
  id boolean primary key default true,
  next_project_title text,
  next_project_body text,
  next_project_image_url text,
  mission_raised_cents integer not null default 0,
  mission_goal_cents integer not null default 0,
  mission_blurb text,
  about_gallery jsonb not null default '[]'::jsonb,
  legal_terms text,
  dashboard_slide_images jsonb not null default '{}'::jsonb,
  updated_at timestamptz not null default now(),
  constraint site_settings_singleton check (id)
);

alter table public.site_settings add column if not exists about_gallery jsonb not null default '[]'::jsonb;
alter table public.site_settings add column if not exists mission_blurb text;
alter table public.site_settings add column if not exists legal_terms text;
-- Background photo per swipeable-dashboard slide — {retail, happenings},
-- each an optional storage URL. The same swiper (and these same
-- backgrounds) is reused as the hero on /shop and /studio, landing on the
-- slide matching that page.
alter table public.site_settings add column if not exists dashboard_slide_images jsonb not null default '{}'::jsonb;
-- Per-slide admin kill switch — {retail, happenings}, each an optional
-- boolean. true hides that slide's real content behind a
-- "coming soon" placeholder (e.g. mid-incident or between iterations)
-- without removing the slide/tab itself.
alter table public.site_settings add column if not exists dashboard_hidden_slides jsonb not null default '{}'::jsonb;
-- Default payment-gateway fee percent applied on top of a deal's member
-- price at checkout (see deal_redemptions below) — snapshotted onto each
-- redemption at purchase time so a later change never rewrites history.
alter table public.site_settings add column if not exists deal_gateway_fee_percent numeric(5,2) not null default 3.00;

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
-- vendors — the merchant side of a deal (Membership Deals Network). Split
-- into a public-safe row (name only) + admin-only notes (vendor_admin_notes,
-- below) — contact info should never come back through a public "show me
-- this deal" query.
-- ----------------------------------------------------------------------------
create table if not exists public.vendors (
  id uuid primary key default gen_random_uuid(),
  name text not null,
  is_active boolean not null default true,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

alter table public.vendors enable row level security;

drop policy if exists "active vendors are public" on public.vendors;
create policy "active vendors are public"
  on public.vendors for select
  using (is_active = true);

drop policy if exists "admins manage vendors" on public.vendors;
create policy "admins manage vendors"
  on public.vendors for all
  using (public.is_admin())
  with check (public.is_admin());

drop trigger if exists set_vendors_updated_at on public.vendors;
create trigger set_vendors_updated_at
  before update on public.vendors
  for each row execute function public.set_updated_at();

create table if not exists public.vendor_admin_notes (
  vendor_id uuid primary key references public.vendors (id) on delete cascade,
  contact_name text,
  contact_email text,
  contact_phone text,
  notes text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

alter table public.vendor_admin_notes enable row level security;

drop policy if exists "admins manage vendor notes" on public.vendor_admin_notes;
create policy "admins manage vendor notes"
  on public.vendor_admin_notes for all
  using (public.is_admin())
  with check (public.is_admin());

drop trigger if exists set_vendor_admin_notes_updated_at on public.vendor_admin_notes;
create trigger set_vendor_admin_notes_updated_at
  before update on public.vendor_admin_notes
  for each row execute function public.set_updated_at();

-- ----------------------------------------------------------------------------
-- deal_categories / deal_subcategories — two-level taxonomy for the deals
-- network, admin-hideable at either level. Rows stay selectable even when
-- hidden (same "coming soon" pattern as dashboard_hidden_slides above) — the
-- app decides what to render, hiding isn't done by withholding the row.
-- ----------------------------------------------------------------------------
create table if not exists public.deal_categories (
  id uuid primary key default gen_random_uuid(),
  slug text not null unique,
  name text not null,
  display_order integer not null default 0,
  is_hidden boolean not null default false,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

alter table public.deal_categories enable row level security;

drop policy if exists "deal categories are public" on public.deal_categories;
create policy "deal categories are public"
  on public.deal_categories for select
  using (true);

drop policy if exists "admins manage deal categories" on public.deal_categories;
create policy "admins manage deal categories"
  on public.deal_categories for all
  using (public.is_admin())
  with check (public.is_admin());

drop trigger if exists set_deal_categories_updated_at on public.deal_categories;
create trigger set_deal_categories_updated_at
  before update on public.deal_categories
  for each row execute function public.set_updated_at();

create table if not exists public.deal_subcategories (
  id uuid primary key default gen_random_uuid(),
  category_id uuid not null references public.deal_categories (id) on delete cascade,
  slug text not null,
  name text not null,
  display_order integer not null default 0,
  is_hidden boolean not null default false,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

alter table public.deal_subcategories drop constraint if exists deal_subcategories_category_slug_key;
alter table public.deal_subcategories add constraint deal_subcategories_category_slug_key
  unique (category_id, slug);

alter table public.deal_subcategories enable row level security;

drop policy if exists "deal subcategories are public" on public.deal_subcategories;
create policy "deal subcategories are public"
  on public.deal_subcategories for select
  using (true);

drop policy if exists "admins manage deal subcategories" on public.deal_subcategories;
create policy "admins manage deal subcategories"
  on public.deal_subcategories for all
  using (public.is_admin())
  with check (public.is_admin());

drop trigger if exists set_deal_subcategories_updated_at on public.deal_subcategories;
create trigger set_deal_subcategories_updated_at
  before update on public.deal_subcategories
  for each row execute function public.set_updated_at();

create index if not exists deal_subcategories_category_id_idx
  on public.deal_subcategories (category_id, display_order);

-- Seed the initial category/subcategory taxonomy. Safe to re-run.
insert into public.deal_categories (slug, name, display_order) values
  ('look-grooming', 'Look & Grooming', 1),
  ('fitness-wellness', 'Fitness & Wellness', 2),
  ('creative-tools-studios', 'Creative Tools & Studios', 3),
  ('food-social', 'Food & Social', 4),
  ('skills-learning', 'Skills & Learning', 5),
  ('work-money', 'Work & Money', 6),
  ('fashion-retail', 'Fashion & Retail', 7)
on conflict (slug) do nothing;

insert into public.deal_subcategories (category_id, slug, name, display_order)
select c.id, v.slug, v.name, v.display_order
from (values
  ('look-grooming', 'barbers', 'Barbers / hairdressers', 1),
  ('look-grooming', 'skincare-aesthetics', 'Skincare / facials / aesthetics', 2),
  ('look-grooming', 'nail-studios', 'Nail studios', 3),
  ('look-grooming', 'tailoring-alterations', 'Tailoring / alterations', 4),
  ('look-grooming', 'dry-cleaning-laundry', 'Dry cleaning / laundry', 5),
  ('fitness-wellness', 'gyms-fitness-studios', 'Gyms / fitness studios', 1),
  ('fitness-wellness', 'martial-arts', 'Muay Thai / boxing / martial arts', 2),
  ('fitness-wellness', 'yoga-pilates', 'Yoga / pilates', 3),
  ('fitness-wellness', 'massage-recovery', 'Massage / recovery', 4),
  ('creative-tools-studios', 'photography-studios', 'Photography studio rentals', 1),
  ('creative-tools-studios', 'videography-studios', 'Videography / production studio rentals', 2),
  ('creative-tools-studios', 'recording-podcast-studios', 'Recording / podcast studios', 3),
  ('creative-tools-studios', 'rehearsal-dance-studios', 'Rehearsal / dance studios', 4),
  ('creative-tools-studios', 'print-shops', 'Print shops', 5),
  ('creative-tools-studios', 'framing-art-supply', 'Framing / art supply stores', 6),
  ('food-social', 'cafes-coworking', 'Cafes / coworking-friendly spots', 1),
  ('food-social', 'bars-lounges', 'Bars / lounges', 2),
  ('food-social', 'restaurants', 'Restaurants', 3),
  ('skills-learning', 'music-lessons', 'Music lessons', 1),
  ('skills-learning', 'dance-lessons', 'Dance lessons', 2),
  ('skills-learning', 'language-classes', 'Language classes', 3),
  ('skills-learning', 'design-software-courses', 'Design/software courses', 4),
  ('work-money', 'coworking-spaces', 'Coworking spaces (day passes)', 1),
  ('work-money', 'freelancer-tools', 'Freelancer accounting/invoicing tools', 2),
  ('work-money', 'business-registration', 'Business registration / ACRA-adjacent services', 3),
  ('fashion-retail', 'sneaker-cleaning', 'Sneaker cleaning/customization', 1),
  ('fashion-retail', 'vintage-thrift', 'Vintage/thrift stores', 2),
  ('fashion-retail', 'jewelry-repair', 'Jewelry/accessories repair', 3)
) as v(category_slug, slug, name, display_order)
join public.deal_categories c on c.slug = v.category_slug
on conflict (category_id, slug) do nothing;

-- ----------------------------------------------------------------------------
-- deals — vendor_rate_cents + margin_percent are the two admin inputs;
-- everything else (member price, gateway fee, checkout total) is derived in
-- the app, never hand-entered. margin_percent defaults to 10% but is
-- editable per deal.
-- ----------------------------------------------------------------------------
create table if not exists public.deals (
  id uuid primary key default gen_random_uuid(),
  vendor_id uuid not null references public.vendors (id) on delete cascade,
  subcategory_id uuid not null references public.deal_subcategories (id) on delete restrict,
  title text not null,
  description text,
  cover_url text,
  locations text[] not null default '{}',
  vendor_rate_cents integer not null,
  margin_percent numeric(5,2) not null default 10.00,
  currency text not null default 'usd',
  redemptions_per_cycle integer not null,
  is_published boolean not null default false,
  published_at timestamptz,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

alter table public.deals drop constraint if exists deals_vendor_rate_non_negative;
alter table public.deals add constraint deals_vendor_rate_non_negative
  check (vendor_rate_cents >= 0);

alter table public.deals drop constraint if exists deals_margin_non_negative;
alter table public.deals add constraint deals_margin_non_negative
  check (margin_percent >= 0);

alter table public.deals drop constraint if exists deals_redemptions_per_cycle_positive;
alter table public.deals add constraint deals_redemptions_per_cycle_positive
  check (redemptions_per_cycle > 0);

-- The vendor's normal walk-in price, for an optional "$33, was $39" savings
-- line on the customer-facing deal card. Nullable — not every vendor has a
-- clean reference retail price to show against.
alter table public.deals add column if not exists original_price_cents integer;

alter table public.deals drop constraint if exists deals_original_price_non_negative;
alter table public.deals add constraint deals_original_price_non_negative
  check (original_price_cents is null or original_price_cents >= 0);

alter table public.deals enable row level security;

drop policy if exists "published deals are public" on public.deals;
create policy "published deals are public"
  on public.deals for select
  using (is_published = true);

drop policy if exists "admins manage deals" on public.deals;
create policy "admins manage deals"
  on public.deals for all
  using (public.is_admin())
  with check (public.is_admin());

drop trigger if exists set_deals_updated_at on public.deals;
create trigger set_deals_updated_at
  before update on public.deals
  for each row execute function public.set_updated_at();

drop trigger if exists set_deals_published_at on public.deals;
create trigger set_deals_published_at
  before insert or update on public.deals
  for each row execute function public.set_published_at();

create index if not exists deals_subcategory_id_idx on public.deals (subcategory_id);
create index if not exists deals_vendor_id_idx on public.deals (vendor_id);
create index if not exists deals_published_idx on public.deals (is_published);

-- ----------------------------------------------------------------------------
-- deal_cycles — one row per deal per calendar month. Materializes "this
-- month's pool" (cap copied from deals.redemptions_per_cycle at cycle
-- creation) and preserves history for monthly vendor payouts once the cycle
-- rolls over — nothing is overwritten on reset, a new row is made.
-- ----------------------------------------------------------------------------
create table if not exists public.deal_cycles (
  id uuid primary key default gen_random_uuid(),
  deal_id uuid not null references public.deals (id) on delete cascade,
  cycle_start date not null,
  redemptions_cap integer not null,
  redemptions_used integer not null default 0,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

alter table public.deal_cycles drop constraint if exists deal_cycles_deal_cycle_start_key;
alter table public.deal_cycles add constraint deal_cycles_deal_cycle_start_key
  unique (deal_id, cycle_start);

alter table public.deal_cycles drop constraint if exists deal_cycles_used_non_negative;
alter table public.deal_cycles add constraint deal_cycles_used_non_negative
  check (redemptions_used >= 0);

alter table public.deal_cycles drop constraint if exists deal_cycles_used_le_cap;
alter table public.deal_cycles add constraint deal_cycles_used_le_cap
  check (redemptions_used <= redemptions_cap);

alter table public.deal_cycles enable row level security;

drop policy if exists "deal cycles are public" on public.deal_cycles;
create policy "deal cycles are public"
  on public.deal_cycles for select
  using (true);

drop policy if exists "admins manage deal cycles" on public.deal_cycles;
create policy "admins manage deal cycles"
  on public.deal_cycles for all
  using (public.is_admin())
  with check (public.is_admin());

drop trigger if exists set_deal_cycles_updated_at on public.deal_cycles;
create trigger set_deal_cycles_updated_at
  before update on public.deal_cycles
  for each row execute function public.set_updated_at();

create index if not exists deal_cycles_deal_id_idx on public.deal_cycles (deal_id, cycle_start);

-- Finds this month's cycle for a deal, creating it (capped from the deal's
-- current redemptions_per_cycle) the first time it's needed that month.
create or replace function public.get_or_create_deal_cycle(p_deal_id uuid)
returns public.deal_cycles
language plpgsql
security definer
set search_path = public
as $$
declare
  v_cycle public.deal_cycles;
  v_cap integer;
  v_start date := date_trunc('month', now())::date;
begin
  select redemptions_per_cycle into v_cap from public.deals where id = p_deal_id;

  if v_cap is null then
    raise exception 'Deal not found';
  end if;

  insert into public.deal_cycles (deal_id, cycle_start, redemptions_cap)
  values (p_deal_id, v_start, v_cap)
  on conflict (deal_id, cycle_start) do nothing;

  select * into v_cycle
  from public.deal_cycles
  where deal_id = p_deal_id and cycle_start = v_start;

  return v_cycle;
end;
$$;

grant execute on function public.get_or_create_deal_cycle(uuid) to anon, authenticated;

-- Called only from the checkout webhook handler once a redemption payment is
-- confirmed — same "clamp, never oversell" pattern as decrement_variant_stock.
create or replace function public.increment_deal_cycle_redemptions(p_cycle_id uuid, p_quantity integer default 1)
returns void
language sql
security definer
set search_path = public
as $$
  update public.deal_cycles
  set redemptions_used = least(redemptions_cap, redemptions_used + p_quantity)
  where id = p_cycle_id;
$$;

grant execute on function public.increment_deal_cycle_redemptions(uuid, integer) to service_role;

-- ----------------------------------------------------------------------------
-- deal_redemptions — one row per member purchase. Pricing is snapshotted at
-- purchase time (vendor rate, margin, gateway fee) so a later change to the
-- deal never rewrites historical payout numbers. Same shape as event_tickets:
-- reference_code for the member to show, approved_at / approved_by for the
-- vendor-counter approval step (MVP: TYCO staff taps approve on the vendor's
-- behalf — see /admin/deal-checkins).
-- ----------------------------------------------------------------------------
create table if not exists public.deal_redemptions (
  id uuid primary key default gen_random_uuid(),
  deal_id uuid not null references public.deals (id) on delete cascade,
  deal_cycle_id uuid not null references public.deal_cycles (id) on delete restrict,
  vendor_id uuid not null references public.vendors (id) on delete restrict,
  user_id uuid not null references auth.users (id) on delete cascade,
  vendor_rate_cents integer not null,
  margin_percent numeric(5,2) not null,
  member_price_cents integer not null,
  gateway_fee_percent numeric(5,2) not null,
  gateway_fee_cents integer not null,
  total_cents integer not null,
  tyco_margin_cents integer not null,
  currency text not null default 'usd',
  status text not null default 'pending',
  revolut_order_id text,
  reference_code text not null default upper(substr(replace(gen_random_uuid()::text, '-', ''), 1, 8)),
  approved_at timestamptz,
  approved_by uuid references auth.users (id) on delete set null,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

alter table public.deal_redemptions drop constraint if exists deal_redemptions_prices_non_negative;
alter table public.deal_redemptions add constraint deal_redemptions_prices_non_negative
  check (
    vendor_rate_cents >= 0 and member_price_cents >= 0 and gateway_fee_cents >= 0
    and total_cents >= 0 and tyco_margin_cents >= 0
  );

alter table public.deal_redemptions drop constraint if exists deal_redemptions_status_check;
alter table public.deal_redemptions add constraint deal_redemptions_status_check
  check (status in ('pending', 'paid', 'cancelled', 'refunded'));

alter table public.deal_redemptions drop constraint if exists deal_redemptions_reference_code_key;
alter table public.deal_redemptions add constraint deal_redemptions_reference_code_key
  unique (reference_code);

alter table public.deal_redemptions enable row level security;

drop policy if exists "members see their own deal redemptions" on public.deal_redemptions;
create policy "members see their own deal redemptions"
  on public.deal_redemptions for select
  using (auth.uid() = user_id);

drop policy if exists "members create their own deal redemptions" on public.deal_redemptions;
create policy "members create their own deal redemptions"
  on public.deal_redemptions for insert
  with check (auth.uid() = user_id and status = 'pending');

drop policy if exists "admins manage all deal redemptions" on public.deal_redemptions;
create policy "admins manage all deal redemptions"
  on public.deal_redemptions for all
  using (public.is_admin())
  with check (public.is_admin());

drop trigger if exists set_deal_redemptions_updated_at on public.deal_redemptions;
create trigger set_deal_redemptions_updated_at
  before update on public.deal_redemptions
  for each row execute function public.set_updated_at();

create index if not exists deal_redemptions_deal_id_idx on public.deal_redemptions (deal_id);
create index if not exists deal_redemptions_deal_cycle_id_idx on public.deal_redemptions (deal_cycle_id);
create index if not exists deal_redemptions_vendor_id_idx on public.deal_redemptions (vendor_id);
create index if not exists deal_redemptions_user_id_idx on public.deal_redemptions (user_id);
create index if not exists deal_redemptions_reference_code_idx on public.deal_redemptions (reference_code);

-- Which of the deal's locations (deals.locations) actually served this
-- redemption — set at approval time, so vendor payouts can be broken down
-- per outlet for a multi-location vendor. Null for single/no-location deals.
alter table public.deal_redemptions add column if not exists redeemed_location text;

-- The vendor-counter approval step. Admin-only for now (MVP: TYCO staff taps
-- this on the vendor's behalf) — refuses to double-approve, same guard as
-- check_in_ticket. Signature changed to take p_location (added the
-- redeemed_location column above) — drop the old 1-arg version first since
-- `create or replace` can't change a function's parameter list, only leave
-- a stale overload behind.
drop function if exists public.approve_deal_redemption(uuid);

create or replace function public.approve_deal_redemption(p_redemption_id uuid, p_location text default null)
returns public.deal_redemptions
language plpgsql
security definer
set search_path = public
as $$
declare
  v_redemption public.deal_redemptions;
begin
  if not public.is_admin() then
    raise exception 'Not authorized';
  end if;

  select * into v_redemption from public.deal_redemptions where id = p_redemption_id for update;

  if v_redemption.id is null then
    raise exception 'Redemption not found';
  end if;

  if v_redemption.status != 'paid' then
    raise exception 'Redemption is not paid';
  end if;

  if v_redemption.approved_at is not null then
    raise exception 'Redemption already approved';
  end if;

  update public.deal_redemptions
  set approved_at = now(), approved_by = auth.uid(), redeemed_location = p_location
  where id = p_redemption_id
  returning * into v_redemption;

  return v_redemption;
end;
$$;

grant execute on function public.approve_deal_redemption(uuid, text) to authenticated;

-- Sweeps a redemption/ticket stuck at "pending" (an abandoned Revolut
-- checkout that never completed) to "cancelled" once it's old enough that
-- it's never coming back. Called lazily from the account and admin list
-- pages rather than on a schedule — a stale pending row costs nothing
-- (deal_cycles only increments on confirmed payment) so exact timing
-- doesn't matter, only that a page that shows one eventually cleans it up.
-- Not scoped to the caller: the age cutoff is the only thing that matters,
-- so any signed-in (or anonymous) caller sweeping globally-stale rows is
-- safe — nothing here reveals anything about who owns which row.
create or replace function public.expire_stale_deal_redemptions()
returns void
language sql
security definer
set search_path = public
as $$
  update public.deal_redemptions
  set status = 'cancelled'
  where status = 'pending'
    and created_at < now() - interval '12 hours';
$$;

grant execute on function public.expire_stale_deal_redemptions() to authenticated, anon;

create or replace function public.expire_stale_event_tickets()
returns void
language sql
security definer
set search_path = public
as $$
  update public.event_tickets
  set status = 'cancelled'
  where status = 'pending'
    and created_at < now() - interval '12 hours';
$$;

grant execute on function public.expire_stale_event_tickets() to authenticated, anon;

-- ----------------------------------------------------------------------------
-- webhook_errors — a scoped-down debug log. Not a catch-all error tracker;
-- specifically for the two integrations that can fail silently from a
-- customer's point of view (a paid order that never reaches Merchize, a
-- Merchize status update that never finds its order), so an admin has
-- somewhere to look instead of grepping Vercel's function logs. Written
-- only by the webhook routes via the service-role client — no insert
-- policy for anyone else, RLS bypassed by design for that one writer.
-- ----------------------------------------------------------------------------
create table if not exists public.webhook_errors (
  id uuid primary key default gen_random_uuid(),
  source text not null,
  message text not null,
  context jsonb,
  created_at timestamptz not null default now()
);

alter table public.webhook_errors drop constraint if exists webhook_errors_source_check;
alter table public.webhook_errors add constraint webhook_errors_source_check
  check (source in ('revolut', 'merchize'));

alter table public.webhook_errors enable row level security;

drop policy if exists "admins read webhook errors" on public.webhook_errors;
create policy "admins read webhook errors"
  on public.webhook_errors for select
  using (public.is_admin());

create index if not exists webhook_errors_created_at_idx
  on public.webhook_errors (created_at desc);

-- ----------------------------------------------------------------------------
-- Storage buckets referenced by the app, plus the RLS policies storage.objects
-- actually needs — creating a public bucket alone does not grant upload
-- access; without an explicit policy nothing (not even a future admin
-- panel) could write to these buckets.
-- ----------------------------------------------------------------------------
insert into storage.buckets (id, name, public)
values
  ('covers', 'covers', true),
  ('portfolio', 'portfolio', true),
  ('products', 'products', true),
  ('about', 'about', true),
  ('deals', 'deals', true)
on conflict (id) do nothing;

-- The 'tracks' and 'artists' buckets (music feature) and 'creators' bucket
-- (creators feature) went with their features. Supabase blocks a direct
-- `delete from storage.buckets` (storage.protect_delete()) — the Storage
-- API is the only supported way to actually remove a bucket, so that's a
-- one-time manual cleanup via the dashboard, not something this file can
-- do. Cutting the bucket out of the policies below is what actually
-- matters: it stops anything from reading or writing to it, so the
-- leftover bucket row (if the dashboard cleanup hasn't happened yet) is
-- inert either way.
drop policy if exists "public read for tyco buckets" on storage.objects;
create policy "public read for tyco buckets"
  on storage.objects for select
  using (bucket_id in ('covers', 'portfolio', 'products', 'about', 'deals'));

drop policy if exists "admins manage tyco bucket objects" on storage.objects;
create policy "admins manage tyco bucket objects"
  on storage.objects for all
  using (bucket_id in ('covers', 'portfolio', 'products', 'about', 'deals') and public.is_admin())
  with check (bucket_id in ('covers', 'portfolio', 'products', 'about', 'deals') and public.is_admin());
