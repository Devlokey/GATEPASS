# Auth Summary — Gatepass

## What's Already Built (DO NOT RECREATE)
- `app/(auth)/login/page.tsx` — Email/password + Google/GitHub OAuth login
- `app/(auth)/signup/page.tsx` — New account creation
- `app/(auth)/forgot-password/page.tsx` — Password reset request
- `app/auth/callback/route.ts` — OAuth redirect handler
- `app/auth/reset-password/page.tsx` — Reset password form
- `middleware.ts` — Session refresh + route protection

## Supabase Client Helpers
- **Browser (client components):** `import { createClient } from '@/lib/supabase/client'`
- **Server (server components / API routes):** `import { createClient } from '@/lib/supabase/server'`

## How to Get the Authenticated User
```ts
// Server component or API route
const supabase = createClient();
const { data: { user } } = await supabase.auth.getUser();
if (!user) redirect('/login'); // or return 401
```

## Protected Routes (middleware handles redirect to /login)
- `/dashboard` and all sub-paths
- `/events/create`
- `/events/[slug]/manage`
- `/events/[slug]/checkin`

## Data Model (relevant for auth-linked queries)
- `auth.users` — Supabase managed
- `profiles` — `id` = `auth.users.id`, has `full_name`, `avatar_url`
- `events` — `organizer_id` = `auth.users.id`
- RLS: organizers can only CRUD their own events/registrations

## Key Types (from `types/index.ts`)
```ts
Event { id, slug, title, description, banner_url, organizer_id, venue,
        start_date, end_date, status: 'draft'|'published'|'completed',
        capacity, is_invite_only, created_at, updated_at }

TicketType { id, event_id, name, price (paise), capacity, is_active }

Registration { id, event_id, ticket_type_id, attendee_name, attendee_email,
               attendee_phone, form_data, status, payment_status, qr_code (UUID),
               razorpay_order_id, created_at }

CheckIn { id, registration_id, checked_in_at, checked_in_by }
```

## Utility Functions (`lib/utils.ts`)
- `formatDate(dateStr)` — "15 March 2026"
- `formatDateTime(dateStr)` — "15 Mar 2026, 10:00 AM"
- `formatPrice(paise)` — "₹500" or "Free"
- `rupeesToPaise(rupees)` — multiply by 100
- `generateSlug(title)` — URL-safe slug
- `isRegistrationOpen(start, end)` — boolean
- `cn(...classes)` — Tailwind class merge

## Existing APIs (DO NOT RECREATE)
- `POST /api/register` — Handles full registration flow (capacity check, QR gen, Razorpay)
- `POST /api/checkin` — Validates QR scan and records check-in (requires organizer JWT)
- `GET  /api/qr/[code]` — Serves QR code image as PNG
- `POST /api/webhooks/razorpay` — Payment webhook handler

## Existing Components (DO NOT RECREATE)
- `components/checkin/QrScanner.tsx` — Full camera QR scanner using html5-qrcode, calls /api/checkin
- `components/registration/RegisterForm.tsx` — Attendee registration form

## Packages Available
- `qrcode` + `qrcode.react` — QR code generation (installed)
- `html5-qrcode` — Camera-based QR scanning (installed)
- `@supabase/ssr` + `@supabase/supabase-js` — DB + Auth
- `lucide-react`, `clsx`, `tailwind-merge`, `zod`, `react-hook-form`
