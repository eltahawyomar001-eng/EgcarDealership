# CarOS Egypt — Project Instructions

## Overview

CarOS Egypt is a Multi-tenant SaaS for Car Dealership Digitalization in Egypt.

## Tech Stack

- **Framework**: Next.js 15 (App Router) with TypeScript
- **Database/Auth**: Supabase (PostgreSQL + RLS)
- **Styling**: Tailwind CSS v4 + Radix UI + Lucide Icons
- **i18n**: i18next (English + Arabic RTL)
- **PWA**: Progressive Web App configuration

## Architecture

- `src/app/(app)/` — Authenticated app routes (dashboard, inventory, sales, installments, attendance, settings)
- `src/app/login/` — Login page with Google/Apple OAuth
- `src/app/auth/` — Auth callback handler
- `src/components/` — Reusable UI components
- `src/lib/` — Utilities, Supabase client, i18n, types
- `supabase/schema.sql` — Database schema with RLS policies

## Conventions

- Use RTL-safe utilities (`ms-`, `me-`, `ps-`, `pe-`, `start`, `end` instead of `left`/`right`)
- All user-facing strings go through `t()` from `react-i18next`
- Use `GlassCard` component for glassmorphism containers
- Use `StatusBadge` with color-coded statuses (green=good, red=action needed)
- Format currency with `formatEGP()` helper
- Mobile-first (90% priority), bottom-nav on mobile, sidebar on desktop

## Database

- Multi-tenant: all tables have `tenant_id`
- RLS policies use `get_user_tenant_id()` helper
- Views: `v_dealership_valuation`, `v_installment_summary`, `v_today_attendance`
