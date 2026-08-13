# SAGANANI Business Hub — Technical README (for Regie)

This is the technical reference for deploying, operating, and maintaining
the SAGANANI.PH Business Hub. It assumes you own the Vercel and Supabase
accounts this runs under.

The **Daily Use Guide** (`README.daily-use.md`) is the one to hand to Maria
Andrea — it has zero technical content on purpose.

---

## 1. Stack overview

| Layer | Choice | Why |
|---|---|---|
| Frontend + backend | Next.js 16 (App Router, TypeScript, Tailwind CSS v4) | One codebase, one deploy target, free hosting on Vercel |
| Database + Auth + (future) file storage | Supabase (hosted Postgres) | Free tier (500MB DB) is far more than this business needs for years; built-in email/password auth and row-level security |
| Hosting | Vercel | Free "Hobby" tier, auto-deploys from GitHub |
| Map picker | Leaflet + OpenStreetMap tiles | No API key, no cost, no usage cap for this scale |
| Charts | Recharts | Client-side, no external service |

### Cost: ₱0 to start — and what could change that

Everything below runs on **free tiers**. Nothing in this build calls a paid
API. Here's exactly where cost could enter later, so you can decide
deliberately instead of being surprised:

- **Supabase free tier**: 500MB database, 1GB file storage, 5GB bandwidth/month,
  and the project **auto-pauses after 7 days of no API activity** (it wakes
  back up on the next request, with a short delay — a non-issue once daily
  use starts, but worth knowing if the app sits idle during a slow launch
  week). Paid tier starts at $25/mo and you would only need it if the
  business scales to the point of exceeding those limits — unlikely for a
  long time at this transaction volume.
- **Vercel free "Hobby" tier**: generous bandwidth and build minutes for a
  single-developer, low-traffic internal tool. You would only hit a wall if
  this were public-facing with high traffic, which it isn't (it's a private,
  login-gated internal tool for 2–3 staff).
- **Custom domain**: optional. Vercel gives you a free `*.vercel.app` URL.
  A custom domain (e.g. `hub.saganani.ph`) costs whatever your domain
  registrar charges (~₱600–1,200/year) — entirely optional, not required
  for this deliverable.
- **Google Fonts (Manrope, Newsreader)**: free, no account needed, loaded
  at build time.
- **Leaflet/OpenStreetMap**: free, no API key, no rate-limit realistic at
  this scale.

If you ever add SMS/email notifications, WhatsApp/Messenger API
integration (mentioned as a future phase for the Inquiry Log), or heavier
file storage (e.g. lots of product photos), revisit this section — those
are the features most likely to introduce real cost.

---

## 2. Project structure

```
supabase/migrations/     SQL schema + seed data (source of truth for the DB)
scripts/create-users.mjs Script to create/add login accounts
src/app/login/           Public login page
src/app/(dashboard)/     Everything behind auth — one folder per module
src/components/          Shared UI (buttons, inputs, Logo, map picker, combobox)
src/lib/                 Supabase clients, constants, formatting helpers
src/proxy.ts             Next.js 16 "proxy" (formerly middleware) — session refresh + route protection
```

Each module under `src/app/(dashboard)/` follows the same pattern:
`page.tsx` (list), `new/page.tsx` + `[id]/edit/page.tsx` (forms), and an
`actions.ts` with the Server Actions that read/write Supabase. This makes
it straightforward to find or extend any module — they're all shaped the
same way.

---

## 3. Local development setup

```bash
git clone <this-repo-url>
cd saganani-business-hub
npm install
cp .env.example .env.local   # then fill in the real values (see Section 4)
npm run dev
```

Open http://localhost:3000 — you'll be redirected to `/login`.

---

## 4. Create the Supabase project

1. Go to https://supabase.com and sign in (or create a free account) with
   the Google/GitHub account you want to own this project.
2. Click **New Project**.
   - **Name**: `saganani-business-hub` (or similar)
   - **Database password**: generate a strong one and save it in your
     password manager — you'll rarely need it (mostly for direct `psql`
     access), but keep it safe.
   - **Region**: pick the closest to the Philippines (e.g. Singapore).
   - **Plan**: Free.
3. Wait ~2 minutes for the project to finish provisioning.
4. In the project dashboard, go to **Project Settings → API**. You'll need:
   - **Project URL** → this is `NEXT_PUBLIC_SUPABASE_URL`
   - **anon / public key** → this is `NEXT_PUBLIC_SUPABASE_ANON_KEY`
   - **service_role key** → this is `SUPABASE_SERVICE_ROLE_KEY` (server-only,
     never expose this in the browser or commit it to git — it bypasses all
     Row Level Security)

### Run the database migrations

The schema and seed data live in `supabase/migrations/`. Run them once
against your new project, in order:

**Option A — Supabase SQL Editor (simplest, no CLI install needed)**

1. In the Supabase dashboard, open **SQL Editor**.
2. Open `supabase/migrations/0001_init.sql` from this repo, copy its full
   contents, paste into a new query, and click **Run**.
3. Do the same for `supabase/migrations/0002_seed.sql`.
4. Do the same for `supabase/migrations/0003_pos.sql` (adds the Barcode
   field used by the POS screens — see Section 14).

If your project already exists and you're only adding the POS feature,
you only need to run `0003_pos.sql` — 0001 and 0002 already applied.

**Option B — Supabase CLI** (if you prefer scripting this / want it
repeatable for a staging project later):

```bash
npx supabase login
npx supabase link --project-ref YOUR-PROJECT-REF
npx supabase db push
```

Either way, after this you should see these tables in **Table Editor**:
`profiles`, `categories`, `products`, `suppliers`, `purchases`, `customers`,
`sales`, `inventory_settings`, `expenses`, `inquiries`, `compliance_items`,
`balance_sheet_settings`, `liabilities` — plus the seeded categories,
products, and compliance checklist.

---

## 5. Create the 2 initial user logins (+ adding a 3rd later)

Supabase Auth users can't be created via plain SQL (passwords need to go
through Supabase's auth admin API), so use the provided script:

1. Make sure `.env.local` has `NEXT_PUBLIC_SUPABASE_URL` and
   `SUPABASE_SERVICE_ROLE_KEY` filled in (from Section 4).
2. Open `scripts/create-users.mjs` and edit the `USERS` array with the
   real emails and **strong, unique passwords** for:
   - Regie (technical/admin)
   - Maria Andrea (owner)
3. Run:
   ```bash
   node --env-file=.env.local scripts/create-users.mjs
   ```
4. Share each password with its owner through a secure channel (not
   email/SMS in plaintext) and have them change it on first login if you
   want extra hygiene (Supabase Auth supports password reset via email if
   you later configure an email provider — optional, not required to launch).

**Adding a 3rd staff login later:** add one more row to the `USERS` array
in `scripts/create-users.mjs` and re-run the same command. No schema change,
no redeploy needed. The new person automatically gets full access, same as
the first two (there's no role system yet — see Section 12 if you want to
add restricted roles later).

You can also create/manage users anytime from the Supabase dashboard under
**Authentication → Users** (e.g. to deactivate someone, or reset a password
by hand).

---

## 6. Create the Vercel project and link it to GitHub

1. Push this repo to GitHub if it isn't already there.
2. Go to https://vercel.com, sign in with your GitHub account.
3. Click **Add New → Project**, select this GitHub repository, and click
   **Import**.
4. Vercel auto-detects Next.js — leave the build settings as default
   (`next build`, output handled automatically).
5. Before clicking Deploy, add the environment variables (Section 7).
6. Click **Deploy**.

Every push to your default branch will auto-deploy from here on. Pull
requests get their own preview URLs automatically.

---

## 7. Set environment variables (Vercel)

In the Vercel project: **Settings → Environment Variables**, add these for
the **Production** (and Preview, if you want preview deploys to work
against the same database) environment:

| Key | Value | Notes |
|---|---|---|
| `NEXT_PUBLIC_SUPABASE_URL` | from Supabase → Project Settings → API | Safe to expose to the browser |
| `NEXT_PUBLIC_SUPABASE_ANON_KEY` | from Supabase → Project Settings → API | Safe to expose — Row Level Security is what actually protects the data |
| `SUPABASE_SERVICE_ROLE_KEY` | from Supabase → Project Settings → API | **Only needed if you run `scripts/create-users.mjs` from a server context.** The web app itself never uses this key — don't add it unless you have a specific reason to, and if you do, it must never be prefixed `NEXT_PUBLIC_` |

After adding/changing env vars, trigger a redeploy (Vercel → Deployments →
"..." → Redeploy) so the new values take effect.

---

## 8. Deploy

Once steps 4–7 are done:

```bash
git push origin main
```

Vercel picks it up automatically. Watch the deploy log in the Vercel
dashboard; when it says "Ready", open the deployment URL, log in with one
of the two accounts you created in Section 5, and confirm the Dashboard
loads.

---

## 9. Backing up the database

Supabase free tier doesn't include automatic point-in-time backups (that's
a paid-tier feature), so back up manually on a schedule that matches how
much you'd hate to lose (weekly is reasonable at launch):

**Quickest — SQL dump via the dashboard:**
Supabase dashboard → **Database → Backups** shows daily backups are
retained for a short rolling window even on the free tier; for a durable
copy you control, use the CLI dump below instead.

**Recommended — CLI dump you keep yourself:**

```bash
npx supabase db dump --db-url "postgresql://postgres:[YOUR-DB-PASSWORD]@[YOUR-PROJECT-REF].supabase.co:5432/postgres" -f backup-$(date +%F).sql
```

(Get the connection string from Supabase → Project Settings → Database →
Connection string. Store the `.sql` file somewhere safe — e.g. a private
Google Drive folder — not in this git repo.)

**Restoring:** create a fresh Supabase project and run the dumped SQL file
against it the same way you ran the migrations in Section 4.

---

## 10. Adding the real logo

The header/sidebar currently shows a placeholder mark (a dashed-border
box with "S") — see `src/components/Logo.tsx`. Once you have the real
logo file:

1. Drop it at `public/logo.svg` (SVG preferred; PNG works too — update the
   extension below to match).
2. In `src/components/Logo.tsx`, replace the placeholder `<span>` block
   with:
   ```tsx
   import Image from "next/image";
   // ...
   <Image src="/logo.svg" alt="SAGANANI.PH" width={size} height={size} />
   ```
3. Commit, push, done.

---

## 11. How the data model maps to the old Excel Financial System

| Excel tab | Database table(s) / view |
|---|---|
| Pricing | `products` (joined to `categories`). `retail_price`, `margin_amount`, `margin_pct`, `suki_margin_pct` are database-computed (generated) columns — edit `unit_cost`, `markup_pct`, or `suki_price` and the rest recalculates automatically. Also holds the nullable `barcode` field used by POS (Section 14). |
| Suppliers | `suppliers` |
| Purchases Log | `purchases` — `total_cost` is auto-computed from `qty × unit_cost` |
| Sales Log | `sales` — `total_sale` is auto-computed from `qty × unit_price`; extended with `customers`, delivery location, and an order-status pipeline the Excel version didn't have |
| Inventory | `inventory_settings` (manual Beginning Qty per product) + the `inventory_status` **view**, which computes Purchased Qty and Sold Qty live from `purchases`/`sales` and derives Ending Qty and Ending Value. Nothing here is stored redundantly — it's all computed on read. |
| Expenses Log | `expenses` |
| Monthly P&L | `monthly_pnl` view — Revenue (Sales Log, excludes Cancelled orders) − COGS (Purchases Log total cost) − Operating Expenses (Expenses Log), grouped by month |
| Cash Flow | `monthly_cash_flow` view — same simplified "everything is cash" assumption as the Excel version; Purchases only count as cash-out once marked **Paid** (Planned purchases don't hit cash flow yet) |
| Balance Sheet | `reports/balance-sheet` page combines: `monthly_cash_position` view (running cash balance), `inventory_status` (inventory value), and the `liabilities` table (manual entries) |

New tables with no Excel equivalent: `customers` (with delivery lat/lng),
`inquiries` (lead log), `compliance_items` (permit tracker), `profiles`
(one row per login). The POS Sell/Restock screens (Section 14) are a new
UI layer only — they write into the existing `sales`/`purchases` tables,
not new tables.

---

## 12. Row Level Security & the "add a 3rd login" design

Every table has RLS enabled with a single policy: any authenticated user
gets full read/write access. There are no per-role restrictions yet — this
was a deliberate Day-1 simplification per the requirements (2 users, both
full access).

To add **role-restricted** access later without a rebuild:

1. Add a `role text default 'staff'` column to `profiles` (e.g. via a new
   migration file `0004_add_roles.sql`).
2. Replace the blanket `using (true)` policies on the tables you want to
   restrict with policies that check `(select role from profiles where id
   = auth.uid())`.
3. No frontend rebuild is required for the data layer — Supabase enforces
   this at the database level. You'd only touch the frontend if you want to
   visually hide/disable buttons for restricted roles too (nice-to-have,
   not required for security since RLS is the real gate).

This is why the schema already has `profiles` as its own table rather than
reading everything off `auth.users` directly — it's the natural place to
hang a `role` column (or a `team`/`permissions` column) whenever you need it.

---

## 13. Toggling the not-yet-active product categories

`Frozen Products`, `Boneless Bangus`, `Sariwang Gulay`, and `Bundle/Suki
Packs` are seeded in the `categories` table with `is_active = false`, so
they're hidden from the Sales/Purchases dropdowns (which only show active
categories) but the schema already supports products under them.

To activate one when the business is ready:

```sql
update categories set is_active = true where slug = 'frozen-products';
```

Run that in the Supabase SQL Editor, then add products under it from the
Pricing Master page as normal — no code change needed.

---

## 14. Point-of-Sale (Sell + Restock) and barcode scanning

Two mobile-first screens live under **POS (Counter)** in the sidebar:

- **`/pos/sell`** — the store counter checkout. Tap products in a category
  grid, or scan a barcode with the phone's camera. Adds a cart, then on
  Checkout writes one row per cart line straight into the same `sales`
  table the Sales Log module uses (`order_source = 'In-store'`,
  `order_status = 'Completed'`). Inventory and the P&L update automatically
  because both are computed live from that table — there's no separate
  deduction logic to keep in sync.
- **`/pos/restock`** — for logging stock received (palengke trips, supplier
  deliveries). Same scan/select flow, queues items with qty + unit cost +
  optional supplier, then saves the batch straight into the same
  `purchases` table the Purchases Log module uses.

**Barcode scanning**: uses the `html5-qrcode` npm package, which reads the
phone's camera through the browser's own `getUserMedia` API — **no paid
service, no API key, no extra hardware**. It only works over HTTPS (Vercel
deployments are HTTPS by default, so this is automatic) and the browser
will prompt for camera permission the first time. Loose/weighed products
(Bigas, Itlog, Dried Fish) have no barcode and simply stay on the
tap-to-select grid — that's expected, not a gap.

**Adding barcodes to products**: edit the product in Pricing Master and
fill in the **Barcode** field (nullable, must be unique). Scanning an
unrecognized barcode in either POS screen offers linking it to an existing
product on the spot, or a pre-filled shortcut to create a new one.

**Device-agnostic by design**: the POS screens are regular pages behind
the same Supabase Auth login as the rest of the app — no local install, no
device pairing. Any phone or tablet can open the URL, log in with either
account, and start selling immediately; switching devices mid-shift loses
nothing because nothing is tied to a specific browser except the
in-progress cart/restock queue (see below).

**Offline**: intentionally not built. The store's internet was confirmed
reliable, so both screens write directly to Supabase on every action — no
local queue to get out of sync.

**Surviving a refresh**: the in-progress cart (Sell) and restock queue
(Restock) are saved to that browser's `localStorage` as you go, so an
accidental refresh on the *same device* recovers them. This is a
convenience for that one browser tab, not a sync mechanism — it will not
appear if you switch to a different phone.

---

## 15. Known limitations / intentional simplifications (Day 1)

- No role-based permissions yet (see Section 12 for how to add them).
- No automated backups on the Supabase free tier (see Section 9).
- No Facebook/TikTok Messenger API integration — the Inquiry Log is
  manual-entry only, by design, ready for that integration later.
- Cash Flow / Balance Sheet use the same simplified "cash basis" assumption
  as the original Excel model, not full accrual accounting.
- The logo is a placeholder — see Section 10.
- POS cart/restock-queue recovery after a refresh is per-device
  (`localStorage`), not synced across devices — see Section 14.
