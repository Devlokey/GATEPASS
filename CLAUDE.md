# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Overview

**Gatepass** is a free, open-source event management platform for Indian college events — a zero-fee alternative to MakeMyPass. Built with Next.js 14 (App Router), TypeScript, and Supabase.

## Commands

```bash
npm install         # Install dependencies
npm run dev         # Start dev server at http://localhost:3000
npm run build       # Build for production
npx vercel          # Deploy to Vercel
npx supabase <cmd>  # Supabase CLI (not globally installed, use via npx)
```

Database migrations are applied manually via Supabase SQL Editor (`supabase/migrations/001_initial_schema.sql`).

## Current State

**The Next.js source code does not exist yet.** The repo currently contains only `README.md`, `ARCHITECTURE.md`, and `gatepass.html` (static landing page). The architecture sections below describe the *intended design*, not existing code.

## Environment Variables

Required in `.env.local` (copy from `.env.local.example`):

```bash
NEXT_PUBLIC_SUPABASE_URL=
NEXT_PUBLIC_SUPABASE_ANON_KEY=
SUPABASE_SERVICE_ROLE_KEY=
RESEND_API_KEY=
RAZORPAY_KEY_ID=          # Only needed for paid events
RAZORPAY_KEY_SECRET=
RAZORPAY_WEBHOOK_SECRET=
NEXT_PUBLIC_APP_URL=
```

## Architecture

### Layers

```
Next.js App (Vercel) → Next.js API Routes → Supabase (DB + Auth + Storage)
                                          → Resend (email)
                                          → Razorpay (payments + webhooks)
```

### App Router Route Groups

- `app/(public)/` — Landing page, public event pages (`/events/[slug]`), registration form
- `app/(auth)/` — Login and signup pages
- `app/(dashboard)/` — Protected organizer dashboard, event creation, event management, QR check-in

### API Routes (`api/`)

| Route | Purpose |
|---|---|
| `register/route.ts` | Handles registration: capacity check, QR generation, Razorpay order creation |
| `checkin/route.ts` | Validates QR scan and records check-in (organizer JWT required) |
| `email/route.ts` | Triggers confirmation/reminder/waitlist emails via Resend |
| `analytics/route.ts` | Stats aggregation and CSV export (organizer JWT required) |
| `webhooks/razorpay/route.ts` | Verifies Razorpay signature, updates payment + registration status, triggers email |

### Key Libraries (`lib/`)

- `lib/supabase/client.ts` — Browser-side Supabase client
- `lib/supabase/server.ts` — Server-side Supabase client (uses service role key)
- `lib/razorpay.ts` — Razorpay SDK wrapper
- `lib/resend.ts` — Resend email client

### Data Model

```
auth.users (Supabase)
    └── profiles
            └── events
                    ├── ticket_types
                    ├── form_fields
                    └── registrations
                                ├── check_ins
                                └── payments
```

Key fields to know:
- `ticket_types.price` — stored in **paise** (₹1 = 100 paise); `0` means free
- `registrations.qr_code` — UUID v4, unique index; used as the scanned QR payload
- `registrations.status` — `pending | confirmed | waitlisted | cancelled`
- `registrations.payment_status` — `free | pending | paid`
- `events.status` — `draft | published | completed`
- `form_fields.options` — JSONB, used for `select` field type

### Critical Flows

**Registration**: capacity check → QR generation → DB insert → (Razorpay order if paid) → confirmation email

**Check-in**: QR scan → lookup `qr_code` in registrations → validate not already checked in → insert `check_ins` row

**Payment**: Razorpay webhook → verify signature → update `payment_status: paid` + `status: confirmed` → trigger email

**Waitlist promotion**: Supabase DB trigger on registration status change → promote oldest waitlisted record → send email

### Security

- Public routes: `/events/[slug]`, `/events/[slug]/register` — no auth
- Protected routes: `/dashboard`, `/events/create`, `/events/[slug]/manage` — Supabase session required
- `/api/register` — rate limited (10 req/min per IP)
- `/api/checkin`, `/api/analytics/*` — organizer JWT required
- `/api/webhooks/*` — Razorpay signature verification only
- RLS enforced at DB level: organizers can only CRUD their own events/registrations

### Scalability Notes

- Capacity race conditions handled via Supabase DB transaction with row-level lock
- Waitlist promotion done via Supabase DB trigger (not application code)
- CSV export uses streaming response — never loads all rows in memory
- Bulk emails on event publish queued via Supabase Edge Functions
