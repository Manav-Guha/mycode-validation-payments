begin;

create extension if not exists pgcrypto;

create type public.market_code as enum ('AE', 'GB');
create type public.product_type as enum ('physical', 'digital', 'subscription');
create type public.order_status as enum ('pending_payment', 'payment_processing', 'paid', 'payment_failed', 'cancelled', 'refunded');
create type public.fulfilment_status as enum ('awaiting_fulfilment', 'preparing', 'dispatched', 'cancelled');
create type public.entitlement_status as enum ('active', 'revoked');

create table public.profiles (
  id uuid primary key references auth.users(id) on delete cascade,
  display_name text not null check (char_length(display_name) between 1 and 80),
  market public.market_code not null,
  stripe_customer_id text unique,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table public.addresses (
  id uuid primary key default gen_random_uuid(),
  customer_id uuid not null references public.profiles(id) on delete cascade,
  recipient_name text not null,
  line1 text not null,
  line2 text,
  city text not null,
  region text not null,
  postal_code text,
  country_code public.market_code not null,
  phone text not null,
  created_at timestamptz not null default now()
);

create table public.products (
  id text primary key,
  slug text not null unique,
  type public.product_type not null,
  title text not null,
  subtitle text not null,
  description text not null,
  active boolean not null default true,
  created_at timestamptz not null default now()
);

create table public.prices (
  id text primary key,
  product_id text not null references public.products(id),
  amount_minor integer not null check (amount_minor > 0),
  currency char(3) not null check (currency = upper(currency)),
  billing_interval text check (billing_interval in ('month') or billing_interval is null),
  stripe_lookup_key text not null unique,
  active boolean not null default true,
  created_at timestamptz not null default now(),
  check ((billing_interval is null) = (product_id <> 'reading-room'))
);

create table public.orders (
  id uuid primary key default gen_random_uuid(),
  merchant_reference text not null unique,
  customer_id uuid not null references public.profiles(id),
  market public.market_code not null,
  status public.order_status not null default 'pending_payment',
  amount_minor integer not null check (amount_minor > 0),
  currency char(3) not null,
  stripe_checkout_session_id text unique,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table public.order_items (
  id uuid primary key default gen_random_uuid(),
  order_id uuid not null references public.orders(id) on delete cascade,
  product_id text not null references public.products(id),
  product_type public.product_type not null,
  title_snapshot text not null,
  amount_minor integer not null,
  currency char(3) not null,
  quantity integer not null default 1 check (quantity = 1)
);

create table public.payments (
  id uuid primary key default gen_random_uuid(),
  order_id uuid not null unique references public.orders(id),
  provider text not null default 'stripe' check (provider = 'stripe'),
  provider_payment_reference text unique,
  amount_minor integer not null,
  currency char(3) not null,
  status text not null check (status in ('processing', 'paid', 'failed', 'refunded')),
  established_at timestamptz,
  created_at timestamptz not null default now()
);

create table public.fulfilments (
  id uuid primary key default gen_random_uuid(),
  order_id uuid not null unique references public.orders(id),
  status public.fulfilment_status not null default 'awaiting_fulfilment',
  address_snapshot jsonb not null,
  carrier text,
  tracking_reference text,
  dispatched_at timestamptz,
  updated_at timestamptz not null default now(),
  check (status <> 'dispatched' or dispatched_at is not null)
);

create table public.digital_entitlements (
  id uuid primary key default gen_random_uuid(),
  customer_id uuid not null references public.profiles(id),
  product_id text not null references public.products(id),
  source_order_id uuid not null references public.orders(id),
  status public.entitlement_status not null default 'active',
  granted_at timestamptz not null default now(),
  revoked_at timestamptz,
  unique (customer_id, product_id)
);

create table public.subscriptions (
  id uuid primary key default gen_random_uuid(),
  customer_id uuid not null references public.profiles(id),
  source_order_id uuid not null references public.orders(id),
  stripe_subscription_id text not null unique,
  stripe_customer_id text not null,
  status text not null,
  current_period_end timestamptz,
  cancel_at_period_end boolean not null default false,
  updated_at timestamptz not null default now()
);

create table public.content_items (
  id text primary key,
  title text not null,
  summary text not null,
  body_markdown text not null,
  storage_path text,
  published_at timestamptz not null,
  subscriber_only boolean not null default true
);

create table public.webhook_events (
  stripe_event_id text primary key,
  event_type text not null,
  processed_at timestamptz not null default now(),
  result text not null
);

create table public.audit_events (
  id bigint generated always as identity primary key,
  entity_type text not null,
  entity_id text not null,
  action text not null,
  actor_id uuid references auth.users(id),
  detail jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now()
);

create or replace function public.handle_new_user()
returns trigger language plpgsql security definer set search_path = '' as $$
begin
  insert into public.profiles (id, display_name, market)
  values (
    new.id,
    coalesce(nullif(new.raw_user_meta_data ->> 'display_name', ''), split_part(new.email, '@', 1)),
    coalesce((new.raw_user_meta_data ->> 'market')::public.market_code, 'AE')
  );
  return new;
end;
$$;

create trigger on_auth_user_created
  after insert on auth.users for each row execute procedure public.handle_new_user();

create or replace function public.create_pending_order(p_product_id text, p_address jsonb default null)
returns jsonb language plpgsql security definer set search_path = '' as $$
declare
  v_customer uuid := auth.uid();
  v_product public.products%rowtype;
  v_price public.prices%rowtype;
  v_profile public.profiles%rowtype;
  v_order public.orders%rowtype;
begin
  if v_customer is null then raise exception 'Authentication required'; end if;
  select * into strict v_product from public.products where id = p_product_id and active;
  select * into strict v_price from public.prices where product_id = p_product_id and active;
  select * into strict v_profile from public.profiles where id = v_customer;

  if v_product.type = 'physical' then
    if p_address is null
      or nullif(trim(p_address ->> 'recipient_name'), '') is null
      or nullif(trim(p_address ->> 'line1'), '') is null
      or nullif(trim(p_address ->> 'city'), '') is null
      or nullif(trim(p_address ->> 'region'), '') is null
      or nullif(trim(p_address ->> 'phone'), '') is null
      or p_address ->> 'country_code' <> v_profile.market::text
    then raise exception 'A valid supported delivery address is required'; end if;
  end if;

  insert into public.orders (merchant_reference, customer_id, market, amount_minor, currency)
  values ('QS-' || to_char(clock_timestamp(), 'YYYYMMDD') || '-' || upper(substr(replace(gen_random_uuid()::text, '-', ''), 1, 8)), v_customer, v_profile.market, v_price.amount_minor, v_price.currency)
  returning * into v_order;

  insert into public.order_items (order_id, product_id, product_type, title_snapshot, amount_minor, currency)
  values (v_order.id, v_product.id, v_product.type, v_product.title, v_price.amount_minor, v_price.currency);

  if v_product.type = 'physical' then
    insert into public.fulfilments (order_id, address_snapshot) values (v_order.id, p_address);
  end if;

  return jsonb_build_object('id', v_order.id, 'merchant_reference', v_order.merchant_reference, 'amount_minor', v_order.amount_minor, 'currency', v_order.currency);
end;
$$;

alter table public.profiles enable row level security;
alter table public.addresses enable row level security;
alter table public.products enable row level security;
alter table public.prices enable row level security;
alter table public.orders enable row level security;
alter table public.order_items enable row level security;
alter table public.payments enable row level security;
alter table public.fulfilments enable row level security;
alter table public.digital_entitlements enable row level security;
alter table public.subscriptions enable row level security;
alter table public.content_items enable row level security;
alter table public.webhook_events enable row level security;
alter table public.audit_events enable row level security;

create policy "profiles_select_own" on public.profiles for select to authenticated using ((select auth.uid()) = id);
-- Profile mutations remain server-controlled so customers cannot alter billing links
-- or market context through the Data API.
create policy "addresses_own" on public.addresses for all to authenticated using ((select auth.uid()) = customer_id) with check ((select auth.uid()) = customer_id);
create policy "catalogue_products_public" on public.products for select to anon, authenticated using (active);
create policy "catalogue_prices_public" on public.prices for select to anon, authenticated using (active);
create policy "orders_select_own" on public.orders for select to authenticated using ((select auth.uid()) = customer_id);
create policy "order_items_select_own" on public.order_items for select to authenticated using (exists (select 1 from public.orders o where o.id = order_id and o.customer_id = (select auth.uid())));
create policy "payments_select_own" on public.payments for select to authenticated using (exists (select 1 from public.orders o where o.id = order_id and o.customer_id = (select auth.uid())));
create policy "fulfilments_select_own" on public.fulfilments for select to authenticated using (exists (select 1 from public.orders o where o.id = order_id and o.customer_id = (select auth.uid())));
create policy "entitlements_select_own" on public.digital_entitlements for select to authenticated using ((select auth.uid()) = customer_id);
create policy "subscriptions_select_own" on public.subscriptions for select to authenticated using ((select auth.uid()) = customer_id);
create policy "published_public_content" on public.content_items for select to anon, authenticated using (not subscriber_only and published_at <= now());

revoke all on public.webhook_events, public.audit_events from anon, authenticated;
revoke all on function public.create_pending_order(text, jsonb) from public, anon;
grant execute on function public.create_pending_order(text, jsonb) to authenticated;

insert into public.products (id, slug, type, title, subtitle, description) values
('notes-on-attention-print', 'notes-on-attention-paperback', 'physical', 'Notes on Attention', 'A field guide for reading deeply in a noisy world', 'A beautifully made paperback about creating the conditions for patient, memorable reading.'),
('field-notes-digital', 'field-notes-for-deep-reading', 'digital', 'Field Notes for Deep Reading', 'A practical digital workbook to keep', 'An original downloadable guide with reflective prompts, reading rituals, and a reusable reading log.'),
('reading-room', 'reading-room-membership', 'subscription', 'The Reading Room', 'New essays and reading guides every month', 'A continuing members library with thoughtful essays, practical reading guides, and scheduled monthly releases.');

insert into public.prices (id, product_id, amount_minor, currency, billing_interval, stripe_lookup_key) values
('price-print-gbp', 'notes-on-attention-print', 2400, 'GBP', null, 'quiet_shelf_print_gbp'),
('price-digital-gbp', 'field-notes-digital', 900, 'GBP', null, 'quiet_shelf_digital_gbp'),
('price-reading-room-usd', 'reading-room', 700, 'USD', 'month', 'quiet_shelf_reading_room_usd_monthly');

insert into public.content_items (id, title, summary, body_markdown, published_at) values
('room-beginning', 'How to Begin a Difficult Book', 'A six-part guide to finding a way into demanding books.', E'# How to Begin a Difficult Book\n\nDifficulty is information, not a verdict. Begin by mapping the book: its shape, recurring vocabulary, and the questions it seems to carry.\n\n## A first-week practice\n\nRead twenty pages without demanding mastery. Mark what returns. At the end, write three sentences: what the author wants, what resists you, and what you want to learn next.', '2026-01-01T00:00:00Z'),
('room-commonplace', 'The Living Commonplace Book', 'Build notes that become more useful as your reading life grows.', E'# The Living Commonplace Book\n\nA commonplace book is not an archive of everything. It is a conversation among the passages that changed your attention.\n\nKeep each entry small: the passage, why it matters now, and one link to an earlier idea. Revisit a page each month and add what has changed.', '2026-02-01T00:00:00Z'),
('room-rereading', 'A Guide to Rereading', 'Choose what deserves a second encounter and read it differently.', E'# A Guide to Rereading\n\nThe second reading is not repetition. Your first encounter supplies the map; the next lets you notice weather, distance, and consequence.\n\nChoose one question the book left unresolved. Follow only that thread, then write a short note to your earlier self.', '2026-03-01T00:00:00Z');

commit;
