# SAGANANI Business Hub

Internal business management web app for **SAGANANI.PH** — a home-based
grocery reselling business in San Mateo, Rizal. Replaces the SAGANANI.PH
Excel Financial System with a shared, mobile-friendly, always-up-to-date
system.

_"Sagana sa Bahay, Sagana sa Buhay"_

## Where to start

- **Deploying, environment setup, backups, adding a staff login** → see
  [`README.technical.md`](./README.technical.md)
- **Logging sales/purchases/expenses, checking inventory, day-to-day use**
  → see [`README.daily-use.md`](./README.daily-use.md)

## Stack

Next.js 16 (App Router) · Supabase (Postgres + Auth) · Tailwind CSS v4 ·
Leaflet/OpenStreetMap · Vercel — all on free tiers. See the cost section of
the technical README for details.

## Quick start (local development)

```bash
npm install
cp .env.example .env.local   # fill in your Supabase project values
npm run dev
```
