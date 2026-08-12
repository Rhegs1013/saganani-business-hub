-- =====================================================================
-- SAGANANI Business Hub - initial schema
-- Mirrors the SAGANANI.PH Excel Financial System tabs:
--   Pricing, Suppliers, Purchases Log, Sales Log, Inventory,
--   Expenses Log, Monthly P&L, Cash Flow, Balance Sheet
-- Adds: profiles (auth), customers + delivery location, inquiries,
--   compliance tracker.
-- =====================================================================

-- ---------------------------------------------------------------------
-- Helper: generic updated_at trigger
-- ---------------------------------------------------------------------
create or replace function public.set_updated_at()
returns trigger
language plpgsql
as $$
begin
  new.updated_at = now();
  return new;
end;
$$;

-- ---------------------------------------------------------------------
-- ENUM TYPES
-- ---------------------------------------------------------------------
create type public.confidence_level as enum ('Verified', 'Needs Verification', 'Unverified');
create type public.payment_status as enum ('Planned', 'Paid');
create type public.customer_type as enum ('Retail', 'Suki');
create type public.order_source as enum ('In-store', 'Facebook', 'TikTok', 'Direct Message', 'Other');
create type public.order_status as enum ('New', 'Confirmed', 'Preparing', 'Ready/Out for Delivery', 'Completed', 'Cancelled');
create type public.expense_category as enum ('Rent', 'Delivery/Gas', 'Packaging', 'Permits/Fees', 'Utilities', 'Other');
create type public.inquiry_platform as enum ('Facebook', 'TikTok', 'Direct');
create type public.inquiry_status as enum ('New', 'Replied', 'Converted to Order', 'Not Interested');
create type public.compliance_status as enum ('Not Started', 'In Progress', 'Completed');

-- ---------------------------------------------------------------------
-- PROFILES  (one row per login; 3rd staff account = one more row, no
-- schema change needed. All profiles currently get full access.)
-- ---------------------------------------------------------------------
create table public.profiles (
  id uuid primary key references auth.users (id) on delete cascade,
  full_name text not null,
  email text not null,
  created_at timestamptz not null default now()
);

create or replace function public.handle_new_user()
returns trigger
language plpgsql
security definer set search_path = public
as $$
begin
  insert into public.profiles (id, full_name, email)
  values (new.id, coalesce(new.raw_user_meta_data ->> 'full_name', new.email), new.email)
  on conflict (id) do nothing;
  return new;
end;
$$;

create trigger on_auth_user_created
  after insert on auth.users
  for each row execute procedure public.handle_new_user();

-- ---------------------------------------------------------------------
-- CATEGORIES  (Bigas, Itlog, Dried Fish active; others seeded inactive)
-- ---------------------------------------------------------------------
create table public.categories (
  id uuid primary key default gen_random_uuid(),
  name text not null unique,
  slug text not null unique,
  is_active boolean not null default true,
  sort_order int not null default 0,
  created_at timestamptz not null default now()
);

-- ---------------------------------------------------------------------
-- PRICING MASTER
-- ---------------------------------------------------------------------
create table public.products (
  id uuid primary key default gen_random_uuid(),
  category_id uuid not null references public.categories (id) on delete restrict,
  name text not null,
  unit text not null,
  unit_cost numeric(12, 2) not null default 0 check (unit_cost >= 0),
  markup_pct numeric(6, 2) not null default 0 check (markup_pct >= 0),
  retail_price numeric(12, 2) generated always as (round(unit_cost * (1 + markup_pct / 100.0), 2)) stored,
  margin_amount numeric(12, 2) generated always as (round(unit_cost * (markup_pct / 100.0), 2)) stored,
  margin_pct numeric(6, 2) generated always as (
    case
      when (1 + markup_pct / 100.0) > 0 then round((markup_pct / 100.0) / (1 + markup_pct / 100.0) * 100, 2)
      else 0
    end
  ) stored,
  suki_price numeric(12, 2),
  suki_margin_pct numeric(6, 2) generated always as (
    case
      when suki_price is not null and suki_price > 0 then round(((suki_price - unit_cost) / suki_price) * 100, 2)
      else null
    end
  ) stored,
  low_stock_threshold numeric(12, 2) not null default 0,
  is_active boolean not null default true,
  notes text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create trigger products_set_updated_at
  before update on public.products
  for each row execute procedure public.set_updated_at();

create index products_category_idx on public.products (category_id);

-- ---------------------------------------------------------------------
-- SUPPLIERS DIRECTORY
-- ---------------------------------------------------------------------
create table public.suppliers (
  id uuid primary key default gen_random_uuid(),
  category_id uuid references public.categories (id) on delete set null,
  name text not null,
  location text,
  distance_km numeric(6, 1),
  products_offered text,
  price_benchmark text,
  payment_terms text,
  moq text,
  delivery_available boolean not null default false,
  contact text,
  confidence_level public.confidence_level not null default 'Unverified',
  notes text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create trigger suppliers_set_updated_at
  before update on public.suppliers
  for each row execute procedure public.set_updated_at();

-- ---------------------------------------------------------------------
-- PURCHASES LOG (feeds COGS + Inventory "Purchased Qty")
-- ---------------------------------------------------------------------
create table public.purchases (
  id uuid primary key default gen_random_uuid(),
  purchase_date date not null default current_date,
  supplier_id uuid references public.suppliers (id) on delete set null,
  category_id uuid not null references public.categories (id) on delete restrict,
  product_id uuid not null references public.products (id) on delete restrict,
  qty numeric(12, 2) not null check (qty > 0),
  unit text not null,
  unit_cost numeric(12, 2) not null check (unit_cost >= 0),
  total_cost numeric(14, 2) generated always as (round(qty * unit_cost, 2)) stored,
  payment_terms text,
  payment_status public.payment_status not null default 'Planned',
  notes text,
  created_by uuid references public.profiles (id) on delete set null,
  created_at timestamptz not null default now()
);

create index purchases_date_idx on public.purchases (purchase_date);
create index purchases_product_idx on public.purchases (product_id);

-- ---------------------------------------------------------------------
-- CUSTOMER DATABASE (with delivery location pin)
-- ---------------------------------------------------------------------
create table public.customers (
  id uuid primary key default gen_random_uuid(),
  name text not null,
  contact_number text,
  fb_handle text,
  tiktok_handle text,
  address text,
  lat double precision,
  lng double precision,
  customer_type public.customer_type not null default 'Retail',
  customer_type_override boolean not null default false,
  notes text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create trigger customers_set_updated_at
  before update on public.customers
  for each row execute procedure public.set_updated_at();

-- ---------------------------------------------------------------------
-- SALES LOG (feeds Revenue)
-- ---------------------------------------------------------------------
create table public.sales (
  id uuid primary key default gen_random_uuid(),
  sale_date date not null default current_date,
  customer_id uuid references public.customers (id) on delete set null,
  customer_type public.customer_type not null default 'Retail',
  category_id uuid not null references public.categories (id) on delete restrict,
  product_id uuid not null references public.products (id) on delete restrict,
  qty numeric(12, 2) not null check (qty > 0),
  unit text not null,
  unit_price numeric(12, 2) not null check (unit_price >= 0),
  total_sale numeric(14, 2) generated always as (round(qty * unit_price, 2)) stored,
  payment_method text not null default 'Cash',
  order_source public.order_source not null default 'In-store',
  order_status public.order_status not null default 'New',
  is_delivery boolean not null default false,
  delivery_address text,
  delivery_lat double precision,
  delivery_lng double precision,
  notes text,
  created_by uuid references public.profiles (id) on delete set null,
  created_at timestamptz not null default now()
);

create index sales_date_idx on public.sales (sale_date);
create index sales_customer_idx on public.sales (customer_id);
create index sales_product_idx on public.sales (product_id);

-- Auto-flag repeat customers as Suki after 2+ completed orders (editable override)
create or replace function public.update_customer_suki_status()
returns trigger
language plpgsql
security definer set search_path = public
as $$
declare
  v_customer_id uuid;
  v_completed_count int;
begin
  v_customer_id := coalesce(new.customer_id, old.customer_id);
  if v_customer_id is null then
    return coalesce(new, old);
  end if;

  select count(*) into v_completed_count
  from public.sales
  where customer_id = v_customer_id and order_status = 'Completed';

  update public.customers
  set customer_type = 'Suki'
  where id = v_customer_id
    and customer_type_override = false
    and customer_type <> 'Suki'
    and v_completed_count >= 2;

  return coalesce(new, old);
end;
$$;

create trigger trg_sales_suki_update
  after insert or update or delete on public.sales
  for each row execute procedure public.update_customer_suki_status();

-- ---------------------------------------------------------------------
-- INVENTORY (Beginning Qty manual input; Purchased/Sold auto from logs)
-- ---------------------------------------------------------------------
create table public.inventory_settings (
  product_id uuid primary key references public.products (id) on delete cascade,
  beginning_qty numeric(12, 2) not null default 0,
  beginning_date date not null default current_date,
  updated_at timestamptz not null default now(),
  updated_by uuid references public.profiles (id) on delete set null
);

create trigger inventory_settings_set_updated_at
  before update on public.inventory_settings
  for each row execute procedure public.set_updated_at();

-- ---------------------------------------------------------------------
-- EXPENSES LOG
-- ---------------------------------------------------------------------
create table public.expenses (
  id uuid primary key default gen_random_uuid(),
  expense_date date not null default current_date,
  category public.expense_category not null,
  description text not null,
  amount numeric(12, 2) not null check (amount >= 0),
  payment_method text,
  notes text,
  created_by uuid references public.profiles (id) on delete set null,
  created_at timestamptz not null default now()
);

create index expenses_date_idx on public.expenses (expense_date);

-- ---------------------------------------------------------------------
-- INQUIRY / LEAD LOG
-- ---------------------------------------------------------------------
create table public.inquiries (
  id uuid primary key default gen_random_uuid(),
  inquiry_date date not null default current_date,
  name_handle text not null,
  platform public.inquiry_platform not null default 'Facebook',
  message_summary text,
  status public.inquiry_status not null default 'New',
  converted_sale_id uuid references public.sales (id) on delete set null,
  created_by uuid references public.profiles (id) on delete set null,
  created_at timestamptz not null default now()
);

create index inquiries_date_idx on public.inquiries (inquiry_date);

-- ---------------------------------------------------------------------
-- COMPLIANCE / PERMIT TRACKER
-- ---------------------------------------------------------------------
create table public.compliance_items (
  id uuid primary key default gen_random_uuid(),
  sort_order int not null default 0,
  name text not null,
  description text,
  status public.compliance_status not null default 'Not Started',
  deadline_date date,
  depends_on_item_id uuid references public.compliance_items (id) on delete set null,
  deadline_offset_days int,
  date_completed date,
  reference_number text,
  notes text,
  updated_at timestamptz not null default now()
);

create trigger compliance_items_set_updated_at
  before update on public.compliance_items
  for each row execute procedure public.set_updated_at();

-- ---------------------------------------------------------------------
-- BALANCE SHEET support tables
-- ---------------------------------------------------------------------
create table public.balance_sheet_settings (
  id int primary key default 1 check (id = 1),
  starting_cash numeric(14, 2) not null default 0,
  updated_at timestamptz not null default now()
);

insert into public.balance_sheet_settings (id, starting_cash) values (1, 0)
  on conflict (id) do nothing;

create trigger balance_sheet_settings_set_updated_at
  before update on public.balance_sheet_settings
  for each row execute procedure public.set_updated_at();

create table public.liabilities (
  id uuid primary key default gen_random_uuid(),
  name text not null,
  amount numeric(14, 2) not null default 0 check (amount >= 0),
  as_of_date date not null default current_date,
  notes text,
  created_at timestamptz not null default now()
);

-- =====================================================================
-- VIEWS
-- =====================================================================

-- Inventory: Beginning + Purchased - Sold = Ending, with low-stock flag
create or replace view public.inventory_status
with (security_invoker = true) as
select
  p.id as product_id,
  p.category_id,
  c.name as category_name,
  p.name as product_name,
  p.unit,
  p.unit_cost,
  p.low_stock_threshold,
  p.is_active,
  coalesce(inv.beginning_qty, 0) as beginning_qty,
  coalesce(inv.beginning_date, date '1900-01-01') as beginning_date,
  coalesce(pur.purchased_qty, 0) as purchased_qty,
  coalesce(sal.sold_qty, 0) as sold_qty,
  coalesce(inv.beginning_qty, 0) + coalesce(pur.purchased_qty, 0) - coalesce(sal.sold_qty, 0) as ending_qty,
  round((coalesce(inv.beginning_qty, 0) + coalesce(pur.purchased_qty, 0) - coalesce(sal.sold_qty, 0)) * p.unit_cost, 2) as ending_value,
  (
    (coalesce(inv.beginning_qty, 0) + coalesce(pur.purchased_qty, 0) - coalesce(sal.sold_qty, 0)) <= p.low_stock_threshold
  ) as is_low_stock
from public.products p
join public.categories c on c.id = p.category_id
left join public.inventory_settings inv on inv.product_id = p.id
left join lateral (
  select sum(pu.qty) as purchased_qty
  from public.purchases pu
  where pu.product_id = p.id
    and pu.purchase_date >= coalesce(inv.beginning_date, date '1900-01-01')
) pur on true
left join lateral (
  select sum(s.qty) as sold_qty
  from public.sales s
  where s.product_id = p.id
    and s.order_status <> 'Cancelled'
    and s.sale_date >= coalesce(inv.beginning_date, date '1900-01-01')
) sal on true;

-- Customer order history rollup
create or replace view public.customer_stats
with (security_invoker = true) as
select
  cu.id as customer_id,
  count(s.id) as total_orders,
  count(s.id) filter (where s.order_status = 'Completed') as completed_orders,
  coalesce(sum(s.total_sale) filter (where s.order_status = 'Completed'), 0) as lifetime_spend,
  max(s.sale_date) as last_order_date
from public.customers cu
left join public.sales s on s.customer_id = cu.id
group by cu.id;

-- Compliance deadlines resolved against dependent items (e.g. BIR = DTI completion + 30 days)
create or replace view public.compliance_status_view
with (security_invoker = true) as
select
  ci.*,
  case
    when ci.deadline_offset_days is not null and dep.date_completed is not null
      then dep.date_completed + (ci.deadline_offset_days || ' days')::interval
    else ci.deadline_date
  end::date as computed_deadline
from public.compliance_items ci
left join public.compliance_items dep on dep.id = ci.depends_on_item_id;

-- Monthly P&L: Revenue (Sales Log) - COGS (Purchases Log) - Operating Expenses (Expenses Log)
create or replace view public.monthly_pnl
with (security_invoker = true) as
with bounds as (
  select least(
    coalesce((select min(sale_date) from public.sales), current_date),
    coalesce((select min(purchase_date) from public.purchases), current_date),
    coalesce((select min(expense_date) from public.expenses), current_date)
  ) as start_date
),
months as (
  select generate_series(
    date_trunc('month', (select start_date from bounds)),
    date_trunc('month', current_date),
    interval '1 month'
  )::date as month_start
),
revenue as (
  select date_trunc('month', sale_date)::date as month_start, sum(total_sale) as revenue
  from public.sales
  where order_status <> 'Cancelled'
  group by 1
),
cogs as (
  select date_trunc('month', purchase_date)::date as month_start, sum(total_cost) as cogs
  from public.purchases
  group by 1
),
opex as (
  select date_trunc('month', expense_date)::date as month_start, sum(amount) as operating_expenses
  from public.expenses
  group by 1
)
select
  m.month_start,
  to_char(m.month_start, 'Mon YYYY') as month_label,
  coalesce(r.revenue, 0) as revenue,
  coalesce(c.cogs, 0) as cogs,
  coalesce(r.revenue, 0) - coalesce(c.cogs, 0) as gross_profit,
  case when coalesce(r.revenue, 0) > 0
    then round((coalesce(r.revenue, 0) - coalesce(c.cogs, 0)) / r.revenue * 100, 2)
    else 0
  end as gross_margin_pct,
  coalesce(o.operating_expenses, 0) as operating_expenses,
  coalesce(r.revenue, 0) - coalesce(c.cogs, 0) - coalesce(o.operating_expenses, 0) as net_income
from months m
left join revenue r on r.month_start = m.month_start
left join cogs c on c.month_start = m.month_start
left join opex o on o.month_start = m.month_start
order by m.month_start;

-- Monthly Cash Flow: simplified, all transactions treated as cash.
-- Purchases only count as cash-out once marked Paid (Planned = not yet paid).
create or replace view public.monthly_cash_flow
with (security_invoker = true) as
with bounds as (
  select least(
    coalesce((select min(sale_date) from public.sales), current_date),
    coalesce((select min(purchase_date) from public.purchases), current_date),
    coalesce((select min(expense_date) from public.expenses), current_date)
  ) as start_date
),
months as (
  select generate_series(
    date_trunc('month', (select start_date from bounds)),
    date_trunc('month', current_date),
    interval '1 month'
  )::date as month_start
),
cash_in as (
  select date_trunc('month', sale_date)::date as month_start, sum(total_sale) as cash_in
  from public.sales
  where order_status <> 'Cancelled'
  group by 1
),
purchases_paid as (
  select date_trunc('month', purchase_date)::date as month_start, sum(total_cost) as purchases_cash_out
  from public.purchases
  where payment_status = 'Paid'
  group by 1
),
opex as (
  select date_trunc('month', expense_date)::date as month_start, sum(amount) as expenses_cash_out
  from public.expenses
  group by 1
)
select
  m.month_start,
  to_char(m.month_start, 'Mon YYYY') as month_label,
  coalesce(ci.cash_in, 0) as cash_in,
  coalesce(pp.purchases_cash_out, 0) as purchases_cash_out,
  coalesce(o.expenses_cash_out, 0) as expenses_cash_out,
  coalesce(ci.cash_in, 0) - coalesce(pp.purchases_cash_out, 0) - coalesce(o.expenses_cash_out, 0) as net_cash_flow
from months m
left join cash_in ci on ci.month_start = m.month_start
left join purchases_paid pp on pp.month_start = m.month_start
left join opex o on o.month_start = m.month_start
order by m.month_start;

-- Running cash position (starting cash + cumulative net cash flow), used by Balance Sheet
create or replace view public.monthly_cash_position
with (security_invoker = true) as
select
  month_start,
  month_label,
  net_cash_flow,
  (select starting_cash from public.balance_sheet_settings where id = 1)
    + sum(net_cash_flow) over (order by month_start) as cash_balance
from public.monthly_cash_flow
order by month_start;

-- =====================================================================
-- ROW LEVEL SECURITY
-- Both Day-1 accounts (and any staff added later) get full access to
-- all business data once logged in. No public/anon access.
-- =====================================================================
alter table public.profiles enable row level security;
alter table public.categories enable row level security;
alter table public.products enable row level security;
alter table public.suppliers enable row level security;
alter table public.purchases enable row level security;
alter table public.customers enable row level security;
alter table public.sales enable row level security;
alter table public.inventory_settings enable row level security;
alter table public.expenses enable row level security;
alter table public.inquiries enable row level security;
alter table public.compliance_items enable row level security;
alter table public.balance_sheet_settings enable row level security;
alter table public.liabilities enable row level security;

create policy "profiles readable by authenticated" on public.profiles
  for select to authenticated using (true);
create policy "profiles self update" on public.profiles
  for update to authenticated using (auth.uid() = id) with check (auth.uid() = id);

create policy "categories full access" on public.categories for all to authenticated using (true) with check (true);
create policy "products full access" on public.products for all to authenticated using (true) with check (true);
create policy "suppliers full access" on public.suppliers for all to authenticated using (true) with check (true);
create policy "purchases full access" on public.purchases for all to authenticated using (true) with check (true);
create policy "customers full access" on public.customers for all to authenticated using (true) with check (true);
create policy "sales full access" on public.sales for all to authenticated using (true) with check (true);
create policy "inventory_settings full access" on public.inventory_settings for all to authenticated using (true) with check (true);
create policy "expenses full access" on public.expenses for all to authenticated using (true) with check (true);
create policy "inquiries full access" on public.inquiries for all to authenticated using (true) with check (true);
create policy "compliance_items full access" on public.compliance_items for all to authenticated using (true) with check (true);
create policy "balance_sheet_settings full access" on public.balance_sheet_settings for all to authenticated using (true) with check (true);
create policy "liabilities full access" on public.liabilities for all to authenticated using (true) with check (true);
