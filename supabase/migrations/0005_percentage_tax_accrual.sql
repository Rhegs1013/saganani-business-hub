-- Accrue the 3% Percentage Tax (already computed monthly in monthly_pnl) as a
-- real "Percentage Tax Payable" liability on the Balance Sheet, and only post
-- the matching cash outflow in Cash Flow on the actual BIR 2551Q quarterly due
-- dates (Apr 25 / Jul 25 / Oct 25 / Jan 25) instead of spreading it monthly.
--
-- Does NOT touch monthly_pnl.net_income, gross_profit, or percentage_tax —
-- those stay exactly as introduced in 0004_percentage_tax.sql.

-- ---------------------------------------------------------------------
-- One row per calendar quarter: tax accrued during the quarter (sum of the
-- monthly_pnl.percentage_tax for its 3 months) and the BIR 2551Q due date.
-- quarter_end + 25 days always lands on the 25th of the month after the
-- quarter (Mar 31 -> Apr 25, Jun 30 -> Jul 25, Sep 30 -> Oct 25, Dec 31 ->
-- Jan 25), so no per-quarter special-casing is needed.
--
-- Known simplification: this doesn't apply BIR's weekend/holiday due-date
-- shift, and downstream views treat the due date as the actual payment date
-- (no real "paid on" record) — fine for a monthly-granularity report, but
-- revisit with a tax_payments table if exact BIR receipt reconciliation is
-- ever needed.
-- ---------------------------------------------------------------------
create or replace view public.quarterly_percentage_tax
with (security_invoker = true) as
with quarters as (
  select
    date_trunc('quarter', month_start)::date as quarter_start,
    sum(percentage_tax) as accrued_tax
  from public.monthly_pnl
  group by 1
)
select
  quarter_start,
  (quarter_start + interval '3 months' - interval '1 day')::date as quarter_end,
  'Q' || to_char(quarter_start, 'Q') || ' ' || to_char(quarter_start, 'YYYY') as quarter_label,
  accrued_tax,
  (quarter_start + interval '3 months' - interval '1 day' + interval '25 days')::date as due_date
from quarters
order by quarter_start;

-- ---------------------------------------------------------------------
-- Snapshot of the running Percentage Tax Payable balance: everything accrued
-- to date, minus everything whose quarterly due date has actually passed
-- (i.e. actually paid in the cash-basis sense). Feeds the Balance Sheet.
-- ---------------------------------------------------------------------
create or replace view public.percentage_tax_payable_status
with (security_invoker = true) as
select
  coalesce((select sum(percentage_tax) from public.monthly_pnl), 0) as total_accrued,
  coalesce((select sum(accrued_tax) from public.quarterly_percentage_tax where due_date <= current_date), 0) as total_paid,
  coalesce((select sum(percentage_tax) from public.monthly_pnl), 0)
    - coalesce((select sum(accrued_tax) from public.quarterly_percentage_tax where due_date <= current_date), 0) as payable_balance;

-- ---------------------------------------------------------------------
-- Monthly Cash Flow: add the Percentage Tax cash outflow, recognized only in
-- the month containing a quarter's due date, and only once that due date has
-- actually passed. Everything else in this view is unchanged from 0001.
-- ---------------------------------------------------------------------
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
),
tax_paid as (
  select date_trunc('month', due_date)::date as month_start, sum(accrued_tax) as percentage_tax_cash_out
  from public.quarterly_percentage_tax
  where due_date <= current_date
  group by 1
)
select
  m.month_start,
  to_char(m.month_start, 'Mon YYYY') as month_label,
  coalesce(ci.cash_in, 0) as cash_in,
  coalesce(pp.purchases_cash_out, 0) as purchases_cash_out,
  coalesce(o.expenses_cash_out, 0) as expenses_cash_out,
  -- net_cash_flow keeps its column position (CREATE OR REPLACE VIEW can't
  -- reorder existing columns) but its formula now also nets out the
  -- Percentage Tax cash outflow below.
  coalesce(ci.cash_in, 0) - coalesce(pp.purchases_cash_out, 0) - coalesce(o.expenses_cash_out, 0)
    - coalesce(tp.percentage_tax_cash_out, 0) as net_cash_flow,
  coalesce(tp.percentage_tax_cash_out, 0) as percentage_tax_cash_out
from months m
left join cash_in ci on ci.month_start = m.month_start
left join purchases_paid pp on pp.month_start = m.month_start
left join opex o on o.month_start = m.month_start
left join tax_paid tp on tp.month_start = m.month_start
order by m.month_start;
