-- =====================================================================
-- SAGANANI Business Hub - POS support
-- Adds a nullable Barcode field to the Pricing Master so packaged
-- products (canned goods, snacks, drinks - once that category goes
-- live) can be scanned at checkout. Loose/weighed items (Bigas, Itlog,
-- Dried Fish) simply leave this blank and stay on the tap-to-select
-- grid in the POS screens.
-- =====================================================================

alter table public.products
  add column barcode text;

-- Postgres treats NULLs as distinct under a UNIQUE constraint, so this
-- still allows any number of products with no barcode while guaranteeing
-- no two products share the same scanned code.
alter table public.products
  add constraint products_barcode_unique unique (barcode);

create index products_barcode_idx on public.products (barcode);
