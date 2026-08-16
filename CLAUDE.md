@AGENTS.md

# Saganani Business Hub — Project Instructions
# SAVE THIS FILE AS: ./CLAUDE.md (or ./.claude/CLAUDE.md) at the repo root
# This loads ALONGSIDE ~/.claude/CLAUDE.md — it does not replace it. Be more
# specific here; keep general working-style rules in the global file.

## Project context
- App for SagananiPH, a home-based grocery reselling business (rice, eggs, dried
  fish; frozen bangus, boneless bangus, and fresh vegetables planned) based in
  San Mateo, Rizal, Philippines. Tagline: "Sagana sa Bahay, Sagana sa Buhay."
- Founder/Owner: Maria Andrea T. Sells via in-store pickup plus Facebook and TikTok
  (@saganani.ph).
- Deployed at saganani-business-hub.vercel.app on Vercel, data in Supabase.
  Regie's login: rgmacasinag@gmail.com.
- Two real users: Regie (owner/builder, technical) and Maria Andrea (day-to-day
  primary user, non-technical). Design every UI change assuming Maria Andrea will
  use it without anyone walking her through it.
- Modules: sales log, purchases log, inventory, expenses, P&L, cash flow, balance
  sheet — digitizing an existing Excel-based system. POS module in progress
  (tap-to-select for loose/weighed items like rice/eggs/dried fish, barcode
  scanning for future pre-packaged items), usable on mobile.
- Store has reliable WiFi with mobile data as backup — no offline mode needed for POS.
- <!-- TODO once confirmed: framework (Next.js?), ORM/DB client, auth method,
     styling approach. Update this block instead of assuming. -->

## Workflows
- New feature: confirm scope in plain terms → check the existing schema/data model
  before adding new tables or fields → implement → test the exact flow Maria Andrea
  would follow → summarize in plain, Taglish-friendly language.
- Any change touching inventory counts or sales/pricing math: implement it, then run
  it against at least 3 real sample transactions (e.g. rice, eggs, dried fish) and
  show the resulting numbers before marking it done. Delegate this check to the
  `finance-checker` subagent (see Agents below).
- Tax/accounting logic must always match SagananiPH's actual BIR registration:
  3% Percentage Tax + Graduated Income Tax — NOT the 8% flat tax option. Flag any
  code that assumes otherwise.
- Before any production deploy (Vercel) or Supabase migration on the live project:
  list exactly what will change and get Regie's confirmation. Delegate this check
  to the `deploy-guard` subagent.
- For repo-wide sweeps (e.g. "check every page for this same bug," "migrate every
  component that uses X"), use a dynamic workflow (say "use a workflow") instead of
  going file-by-file in chat.

## Agents
Two project subagents live in `.claude/agents/` (provided alongside this file):
- `finance-checker` — read-only reviewer for any code touching money (P&L, cash
  flow, tax, pricing, inventory valuation, POS totals). Verifies math against
  sample numbers before signing off. Delegate to it automatically whenever a change
  touches a financial calculation.
- `deploy-guard` — pre-deploy checklist runner for Vercel/Supabase. Confirms which
  environment a command targets, lists pending migrations, checks for missing env
  vars. Delegate to it before any production deploy or migration.

## Tools & permissions
- `.claude/settings.json` (provided alongside this file) sets baseline permission
  rules for this project. Key defaults: ask before `git push`, ask before any
  Supabase migration/push/reset command, ask before `rm -rf`, deny force-push.
  Review and adjust once you confirm your actual CLI toolchain (e.g. exact Supabase
  CLI commands used).
- Currency is always PHP (₱) in this project — never default to USD or SAR.
- Keep Maria Andrea's day-to-day screens (sales entry, inventory check, POS) simple.
  Don't add settings, config panels, or options she won't use — put anything
  technical behind a separate admin view for Regie only.

## Conventions
<!-- TODO once confirmed: folder structure, naming conventions, component patterns,
     state management approach. Fill this in as the codebase solidifies so future
     sessions don't have to rediscover it every time. -->
