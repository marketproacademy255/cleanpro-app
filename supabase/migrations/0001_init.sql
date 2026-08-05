-- CleanPro platform schema
-- Enable extensions
create extension if not exists "pgcrypto";

-- ========== ENUM TYPES ==========
do $$ begin
  create type user_role as enum ('customer','admin','cleaner');
exception when duplicate_object then null; end $$;

do $$ begin
  create type booking_status as enum ('pending','confirmed','assigned','in_progress','completed','cancelled');
exception when duplicate_object then null; end $$;

do $$ begin
  create type booking_frequency as enum ('once','weekly','biweekly','monthly');
exception when duplicate_object then null; end $$;

do $$ begin
  create type property_type as enum ('home','office');
exception when duplicate_object then null; end $$;

do $$ begin
  create type payment_provider as enum ('payme','click');
exception when duplicate_object then null; end $$;

do $$ begin
  create type payment_status as enum ('pending','paid','cancelled','failed');
exception when duplicate_object then null; end $$;

-- ========== PROFILES ==========
create table if not exists public.profiles (
  id uuid primary key references auth.users(id) on delete cascade,
  full_name text,
  phone text,
  role user_role not null default 'customer',
  created_at timestamptz not null default now()
);

-- ========== CLEANERS (STAFF) ==========
create table if not exists public.cleaners (
  id uuid primary key default gen_random_uuid(),
  profile_id uuid references public.profiles(id) on delete set null,
  full_name text not null,
  phone text,
  photo_url text,
  bio text,
  years_experience int default 0,
  rating numeric(2,1) default 5.0,
  is_active boolean not null default true,
  created_at timestamptz not null default now()
);

-- ========== SERVICE TYPES ==========
create table if not exists public.service_types (
  id uuid primary key default gen_random_uuid(),
  code text unique not null,
  name_uz text not null,
  name_en text,
  description_uz text,
  property_type property_type not null default 'home',
  pricing_unit text not null default 'per_room',
  base_price numeric(12,2) not null default 0,
  extra_unit_price numeric(12,2) not null default 0,
  min_price numeric(12,2) not null default 0,
  multiplier numeric(4,2) not null default 1.0,
  is_active boolean not null default true,
  sort_order int default 0,
  created_at timestamptz not null default now()
);

-- ========== ADDONS ==========
create table if not exists public.addons (
  id uuid primary key default gen_random_uuid(),
  code text unique not null,
  name_uz text not null,
  price numeric(12,2) not null default 0,
  is_active boolean not null default true,
  sort_order int default 0
);

-- ========== BOOKINGS ==========
create table if not exists public.bookings (
  id uuid primary key default gen_random_uuid(),
  customer_id uuid references public.profiles(id) on delete set null,
  service_type_id uuid references public.service_types(id),
  cleaner_id uuid references public.cleaners(id) on delete set null,
  property_type property_type not null default 'home',
  rooms int default 1,
  area_sqm numeric(8,2),
  address text not null,
  city text default 'Toshkent',
  scheduled_date date not null,
  scheduled_time time not null,
  frequency booking_frequency not null default 'once',
  addon_codes text[] default '{}',
  contact_name text,
  contact_phone text not null,
  notes text,
  base_amount numeric(12,2) not null default 0,
  discount_amount numeric(12,2) not null default 0,
  total_amount numeric(12,2) not null default 0,
  currency text not null default 'UZS',
  status booking_status not null default 'pending',
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

-- ========== PAYMENTS ==========
create table if not exists public.payments (
  id uuid primary key default gen_random_uuid(),
  booking_id uuid not null references public.bookings(id) on delete cascade,
  provider payment_provider not null,
  provider_transaction_id text,
  amount numeric(12,2) not null,
  state text,
  status payment_status not null default 'pending',
  raw_payload jsonb,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  performed_at timestamptz,
  cancelled_at timestamptz
);

create index if not exists idx_payments_booking on public.payments(booking_id);
create index if not exists idx_payments_provider_tx on public.payments(provider, provider_transaction_id);
create index if not exists idx_bookings_customer on public.bookings(customer_id);
create index if not exists idx_bookings_status on public.bookings(status);

-- ========== updated_at trigger ==========
create or replace function public.set_updated_at()
returns trigger as $$
begin
  new.updated_at = now();
  return new;
end;
$$ language plpgsql;

drop trigger if exists trg_bookings_updated_at on public.bookings;
create trigger trg_bookings_updated_at before update on public.bookings
for each row execute function public.set_updated_at();

drop trigger if exists trg_payments_updated_at on public.payments;
create trigger trg_payments_updated_at before update on public.payments
for each row execute function public.set_updated_at();

-- ========== auto-create profile on signup ==========
create or replace function public.handle_new_user()
returns trigger as $$
begin
  insert into public.profiles (id, full_name, phone, role)
  values (new.id, new.raw_user_meta_data->>'full_name', new.raw_user_meta_data->>'phone', 'customer')
  on conflict (id) do nothing;
  return new;
end;
$$ language plpgsql security definer set search_path = public;

drop trigger if exists on_auth_user_created on auth.users;
create trigger on_auth_user_created
  after insert on auth.users
  for each row execute function public.handle_new_user();

-- ========== RLS ==========
alter table public.profiles enable row level security;
alter table public.cleaners enable row level security;
alter table public.service_types enable row level security;
alter table public.addons enable row level security;
alter table public.bookings enable row level security;
alter table public.payments enable row level security;

create or replace function public.is_admin()
returns boolean as $$
  select exists (
    select 1 from public.profiles where id = auth.uid() and role = 'admin'
  );
$$ language sql security definer stable;

drop policy if exists "profiles_select_own_or_admin" on public.profiles;
create policy "profiles_select_own_or_admin" on public.profiles
  for select using (auth.uid() = id or public.is_admin());

drop policy if exists "profiles_update_own_or_admin" on public.profiles;
create policy "profiles_update_own_or_admin" on public.profiles
  for update using (auth.uid() = id or public.is_admin());

drop policy if exists "profiles_insert_own" on public.profiles;
create policy "profiles_insert_own" on public.profiles
  for insert with check (auth.uid() = id);

drop policy if exists "service_types_public_read" on public.service_types;
create policy "service_types_public_read" on public.service_types
  for select using (is_active = true or public.is_admin());

drop policy if exists "service_types_admin_write" on public.service_types;
create policy "service_types_admin_write" on public.service_types
  for all using (public.is_admin()) with check (public.is_admin());

drop policy if exists "addons_public_read" on public.addons;
create policy "addons_public_read" on public.addons
  for select using (is_active = true or public.is_admin());

drop policy if exists "addons_admin_write" on public.addons;
create policy "addons_admin_write" on public.addons
  for all using (public.is_admin()) with check (public.is_admin());

drop policy if exists "cleaners_public_read" on public.cleaners;
create policy "cleaners_public_read" on public.cleaners
  for select using (is_active = true or public.is_admin());

drop policy if exists "cleaners_admin_write" on public.cleaners;
create policy "cleaners_admin_write" on public.cleaners
  for all using (public.is_admin()) with check (public.is_admin());

drop policy if exists "bookings_select_own_or_admin" on public.bookings;
create policy "bookings_select_own_or_admin" on public.bookings
  for select using (auth.uid() = customer_id or public.is_admin());

drop policy if exists "bookings_insert_own" on public.bookings;
create policy "bookings_insert_own" on public.bookings
  for insert with check (auth.uid() = customer_id or public.is_admin());

drop policy if exists "bookings_update_own_or_admin" on public.bookings;
create policy "bookings_update_own_or_admin" on public.bookings
  for update using (auth.uid() = customer_id or public.is_admin());

drop policy if exists "bookings_delete_admin" on public.bookings;
create policy "bookings_delete_admin" on public.bookings
  for delete using (public.is_admin());

drop policy if exists "payments_select_own_or_admin" on public.payments;
create policy "payments_select_own_or_admin" on public.payments
  for select using (
    public.is_admin() or
    exists (select 1 from public.bookings b where b.id = payments.booking_id and b.customer_id = auth.uid())
  );
