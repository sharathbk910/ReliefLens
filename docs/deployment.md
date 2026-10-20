# ReliefLens — Production Deployment Guide

## Architecture Overview

ReliefLens is architected for cloud-native deployment using:
- **Frontend**: Vite SPA deployed to Vercel, Netlify, or Cloudflare Pages.
- **Backend**: Supabase Edge Functions (Deno / TypeScript).
- **Database**: Supabase PostgreSQL with version-controlled migrations and RLS.

---

## 1. Database Deployment (Supabase CLI)

1. Link to your remote Supabase project:
   ```bash
   npx supabase link --project-ref YOUR_PROJECT_REF
   ```

2. Apply the production migration:
   ```bash
   npx supabase db push
   ```
   *Applies: `supabase/migrations/20261020000000_init_relieflens.sql`.*

3. Seed the prototype dataset (optional):
   ```bash
   npx supabase db reset --seed
   ```
   *Executes: `supabase/seed.sql`.*

---

## 2. Supabase Edge Functions Deployment

Deploy the 5 authoritative Edge Functions:

```bash
# 1. Report Ingestion
npx supabase functions deploy ingest-report

# 2. Duplicate Review (Merge / Reject)
npx supabase functions deploy review-duplicate

# 3. Priority Override
npx supabase functions deploy override-priority

# 4. Status & Verification Updates
npx supabase functions deploy update-incident-status

# 5. Batch Rescore (Admin only)
npx supabase functions deploy rescore-incidents
```

---

## 3. Frontend Deployment (Vercel / Netlify)

1. Build command:
   ```bash
   npm run build
   ```
2. Output directory:
   `dist`
3. Configure environment variables in host dashboard:
   ```env
   VITE_SUPABASE_URL=https://YOUR_PROJECT_ID.supabase.co
   VITE_SUPABASE_ANON_KEY=YOUR_SUPABASE_ANON_PUBLIC_KEY
   VITE_MAP_TILE_URL=https://tile.openstreetmap.org/{z}/{x}/{y}.png
   ```

---

## 4. Offline & Sandbox Fallback

If `VITE_SUPABASE_URL` and `VITE_SUPABASE_ANON_KEY` are not provided, ReliefLens automatically falls back to its built-in local database engine with in-memory & localStorage persistence. This ensures the demo application is always immediately functional in sandbox environments.
