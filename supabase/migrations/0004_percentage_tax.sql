-- Add the 3% Percentage Tax line to the Monthly P&L view, per SagananiPH's
-- actual BIR registration (3% Percentage Tax + Graduated Income Tax, not the
-- 8% flat tax option). Percentage Tax is computed on gross sales/receipts
-- (Revenue), independent of expenses or COGS.
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
  coalesce(r.revenue, 0) - coalesce(c.cogs, 0) - coalesce(o.operating_expenses, 0) as net_income,
  round(coalesce(r.revenue, 0) * 0.03, 2) as percentage_tax,
  (coalesce(r.revenue, 0) - coalesce(c.cogs, 0) - coalesce(o.operating_expenses, 0))
    - round(coalesce(r.revenue, 0) * 0.03, 2) as net_income_after_tax
from months m
left join revenue r on r.month_start = m.month_start
left join cogs c on c.month_start = m.month_start
left join opex o on o.month_start = m.month_start
order by m.month_start;
