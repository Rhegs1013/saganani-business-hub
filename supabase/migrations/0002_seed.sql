-- =====================================================================
-- SAGANANI Business Hub - seed data
-- Real current product line-up (Bigas, Itlog, Dried Fish) plus the
-- not-yet-active categories kept hidden/disabled by default.
-- =====================================================================

-- ---------------------------------------------------------------------
-- CATEGORIES
-- ---------------------------------------------------------------------
insert into public.categories (name, slug, is_active, sort_order) values
  ('Bigas', 'bigas', true, 1),
  ('Itlog', 'itlog', true, 2),
  ('Dried Fish', 'dried-fish', true, 3),
  ('Frozen Products', 'frozen-products', false, 4),
  ('Boneless Bangus', 'boneless-bangus', false, 5),
  ('Sariwang Gulay', 'sariwang-gulay', false, 6),
  ('Bundle/Suki Packs', 'bundle-suki-packs', false, 7)
on conflict (slug) do nothing;

-- ---------------------------------------------------------------------
-- PRICING MASTER (real starting figures from the founder)
-- ---------------------------------------------------------------------
insert into public.products (category_id, name, unit, unit_cost, markup_pct, low_stock_threshold, is_active, notes)
select c.id, v.name, v.unit, v.unit_cost, v.markup_pct, v.low_stock_threshold, true, v.notes
from (values
  ('bigas', 'Sinandomeng (Local)', 'kg', 42.00, 14.00, 20, null),
  ('bigas', 'Dinorado/Premium', 'kg', 52.00, 14.00, 20, null),
  ('itlog', 'Itlog Medium (tray of 30)', 'tray', 210.00, 15.00, 5,
    'Markup is a starting placeholder — adjust once retail price is finalized.'),
  ('dried-fish', 'Tuyo', 'kg', 280.00, 20.00, 5,
    'Placeholder cost — confirm with supplier before finalizing price.'),
  ('dried-fish', 'Tunsoy', 'kg', 220.00, 20.00, 5,
    'Placeholder cost — confirm with supplier before finalizing price.'),
  ('dried-fish', 'Dilis', 'kg', 380.00, 20.00, 5,
    'Placeholder cost — confirm with supplier before finalizing price.')
) as v(category_slug, name, unit, unit_cost, markup_pct, low_stock_threshold, notes)
join public.categories c on c.slug = v.category_slug;

-- Seed a Beginning Qty of 0 for every product so Inventory shows immediately
insert into public.inventory_settings (product_id, beginning_qty, beginning_date)
select id, 0, current_date from public.products
on conflict (product_id) do nothing;

-- ---------------------------------------------------------------------
-- COMPLIANCE / PERMIT TRACKER (Phase 0 of the Launch Project Plan)
-- ---------------------------------------------------------------------
with dti as (
  insert into public.compliance_items (sort_order, name, description, status)
  values (
    1,
    'DTI Business Name Registration',
    'Register the "SAGANANI.PH" business name with the Department of Trade and Industry.',
    'Not Started'
  )
  returning id
),
brgy as (
  insert into public.compliance_items (sort_order, name, description, status)
  values (
    2,
    'Barangay Business Clearance',
    'Secure a Barangay Business Clearance for the Sta. Ana, San Mateo, Rizal address.',
    'Not Started'
  )
  returning id
),
bir as (
  insert into public.compliance_items (sort_order, name, description, status, depends_on_item_id, deadline_offset_days)
  select
    3,
    'BIR Registration (Form 1901)',
    'File BIR Form 1901. HARD DEADLINE: within 30 days of the DTI Certificate of Business Name Registration date. Required under RA 11967 (Internet Transactions Act) even for small online sellers — there is no minimum-income exemption.',
    'Not Started',
    dti.id,
    30
  from dti
  returning id
),
permit as (
  insert into public.compliance_items (sort_order, name, description, status)
  values (
    4,
    'Mayor''s / Business Permit',
    'Secure the Mayor''s Permit / Business Permit from the San Mateo, Rizal LGU.',
    'Not Started'
  )
  returning id
)
insert into public.compliance_items (sort_order, name, description, status)
values (
  5,
  'BIR Registration Seal / Badge on Social Media',
  'Display the BIR-issued Registration Seal/Badge on the Facebook and TikTok (@saganani.ph) pages once BIR registration is complete, per RA 11967.',
  'Not Started'
);
