# Gatepass — System Architecture

> Free, open-source alternative to MakeMyPass. Built with Next.js + Supabase.

---

## High-Level Overview

```
┌─────────────────────────────────────────────────────┐
│                    CLIENT LAYER                      │
│         Next.js 14 App (Vercel Edge Network)        │
│   Public Pages │ Auth Pages │ Dashboard │ Check-in  │
└─────────────────────────┬───────────────────────────┘
                          │
┌─────────────────────────▼───────────────────────────┐
│                   API LAYER                          │
│              Next.js API Routes                      │
│   /api/events │ /api/register │ /api/checkin        │
│   /api/tickets │ /api/webhooks │ /api/email         │
└────┬──────────────┬──────────────┬──────────────────┘
     │              │              │
┌────▼────┐   ┌─────▼─────┐  ┌───▼──────────┐
│Supabase │   │  Resend   │  │  Razorpay    │
│DB+Auth  │   │  Email    │  │  Payments    │
│Storage  │   │           │  │  Webhooks    │
└─────────┘   └───────────┘  └──────────────┘
```

---

## Data Architecture

```
auth.users (Supabase managed)
     │
     ▼
profiles ──────────────── events
                              │
              ┌───────────────┼───────────────┐
              │               │               │
         ticket_types    form_fields    registrations
                                             │
                                        ┌────┴────┐
                                     check_ins  payments
```

---

## Database Schema

### `profiles`
| Column | Type | Notes |
|---|---|---|
| id | uuid | fk → auth.users |
| full_name | text | |
| avatar_url | text | |
| created_at | timestamptz | |

### `events`
| Column | Type | Notes |
|---|---|---|
| id | uuid | primary key |
| slug | text | unique, custom URL |
| title | text | |
| description | text | |
| banner_url | text | Supabase storage |
| logo_url | text | Supabase storage |
| organizer_id | uuid | fk → profiles |
| start_date | timestamptz | |
| end_date | timestamptz | |
| registration_start | timestamptz | |
| registration_end | timestamptz | |
| status | enum | draft / published / completed |
| capacity | integer | |
| is_invite_only | boolean | |
| created_at | timestamptz | |
| updated_at | timestamptz | |

### `ticket_types`
| Column | Type | Notes |
|---|---|---|
| id | uuid | primary key |
| event_id | uuid | fk → events |
| name | text | |
| description | text | |
| price | integer | 0 = free, in paise |
| capacity | integer | |
| is_active | boolean | |
| created_at | timestamptz | |

### `form_fields`
| Column | Type | Notes |
|---|---|---|
| id | uuid | primary key |
| event_id | uuid | fk → events |
| label | text | |
| field_type | enum | text / email / phone / select / checkbox |
| options | jsonb | for select fields |
| is_required | boolean | |
| order_index | integer | for field ordering |

### `registrations`
| Column | Type | Notes |
|---|---|---|
| id | uuid | primary key |
| event_id | uuid | fk → events |
| ticket_type_id | uuid | fk → ticket_types |
| attendee_name | text | |
| attendee_email | text | |
| form_data | jsonb | custom field responses |
| status | enum | pending / confirmed / waitlisted / cancelled |
| qr_code | text | unique UUID v4 |
| payment_status | enum | free / pending / paid |
| created_at | timestamptz | |

### `check_ins`
| Column | Type | Notes |
|---|---|---|
| id | uuid | primary key |
| registration_id | uuid | fk → registrations |
| checked_in_at | timestamptz | |
| checked_in_by | uuid | fk → profiles |

---

## Request Flows

### Registration Flow
```
User visits /events/[slug]
     │
     ▼
Fetch event + ticket_types + form_fields
     │
     ▼
User fills form → POST /api/register
     │
     ├── Check capacity
     │        ├── Available → status: confirmed
     │        └── Full → status: waitlisted
     │
     ├── Generate QR string (uuid v4)
     │
     ├── Save to registrations table
     │
     ├── Free ticket? → done
     │   Paid ticket? → create Razorpay order → redirect to payment
     │
     └── Trigger confirmation email via Resend
```

### Check-in Flow
```
Organizer opens /events/[slug]/manage/checkin
     │
     ▼
Camera activates → scans QR code
     │
     ▼
POST /api/checkin { qr_code }
     │
     ├── Find registration by qr_code
     │        ├── Not found → "Invalid QR"
     │        ├── Already checked in → "Already entered"
     │        └── Valid → insert check_ins row
     │
     └── Return attendee name + ticket type → show on screen
```

### Payment Flow
```
POST /api/register → Razorpay order created
     │
     ▼
User completes payment on Razorpay
     │
     ▼
Razorpay → POST /api/webhooks/razorpay
     │
     ├── Verify webhook signature
     ├── Update registration payment_status → paid
     ├── Update registration status → confirmed
     └── Trigger confirmation email
```

### Waitlist Promotion Flow
```
Registration cancelled / ticket freed
     │
     ▼
Supabase trigger fires
     │
     ▼
Find oldest waitlisted registration for same ticket_type
     │
     ├── Promote → status: confirmed
     └── Send "You're in!" email via Resend
```

---

## Module Breakdown

| Module | Responsibility | Key Routes |
|---|---|---|
| Auth | Login, signup, session management | `/app/auth/` |
| Events | CRUD, slug generation, status transitions | `/app/events/` |
| Registration | Form rendering, capacity check, QR generation | `/api/register/` |
| Ticketing | Ticket types, pricing, capacity limits | `/api/tickets/` |
| Check-in | QR scan, validation, real-time updates | `/api/checkin/` |
| Payments | Razorpay order creation, webhook handling | `/api/webhooks/razorpay/` |
| Email | Confirmation, reminders, waitlist alerts | `/api/email/` |
| Analytics | Stats aggregation, CSV export | `/api/analytics/` |

---

## Route Map

```
/                           → Landing page (public)
/auth/login                 → Login
/auth/signup                → Signup
/dashboard                  → Organizer dashboard (protected)
/events/create              → Create event (protected)
/events/[slug]              → Public event page
/events/[slug]/register     → Registration form (public)
/events/[slug]/manage       → Organizer view (protected)
/events/[slug]/manage/checkin → QR scanner (protected)
```

---

## Security Architecture

```
Public routes          → No auth required
  /events/[slug]
  /events/[slug]/register

Protected routes       → Supabase session required
  /dashboard
  /events/create
  /events/[slug]/manage
  /events/[slug]/manage/checkin

API protection
  /api/register        → Rate limited (10 req/min per IP)
  /api/checkin         → Organizer JWT required
  /api/webhooks/*      → Signature verification only
  /api/analytics/*     → Organizer JWT required

Row Level Security (RLS)
  events               → owner: full CRUD / public: READ published only
  registrations        → attendee: READ own / organizer: READ all for their events
  check_ins            → organizer only
  ticket_types         → owner: full CRUD / public: READ active only
```

---

## Scalability Decisions

| Problem | Solution |
|---|---|
| 500 simultaneous check-ins | Supabase Realtime + optimistic UI updates |
| Capacity race condition | Supabase DB transaction with row-level lock |
| Bulk email on event publish | Queue via Supabase Edge Functions |
| Large CSV export | Stream response — never load all rows in memory |
| QR uniqueness guarantee | UUID v4, unique index on qr_code column |
| Waitlist promotion | Supabase DB trigger on registration status change |

---

## Tech Stack

| Layer | Technology |
|---|---|
| Framework | Next.js 14 (App Router) |
| Language | TypeScript |
| Styling | Tailwind CSS + shadcn/ui |
| Database | Supabase (PostgreSQL) |
| Auth | Supabase Auth |
| Storage | Supabase Storage |
| Email | Resend |
| Payments | Razorpay |
| QR Generation | qrcode.react |
| QR Scanning | html5-qrcode |
| Charts | Recharts |
| Rich Text | Tiptap |
| Hosting | Vercel |

---

## Environment Variables

```bash
# Supabase
NEXT_PUBLIC_SUPABASE_URL=
NEXT_PUBLIC_SUPABASE_ANON_KEY=
SUPABASE_SERVICE_ROLE_KEY=

# Resend
RESEND_API_KEY=

# Razorpay
RAZORPAY_KEY_ID=
RAZORPAY_KEY_SECRET=
RAZORPAY_WEBHOOK_SECRET=

# App
NEXT_PUBLIC_APP_URL=
```

---

## Folder Structure

```
gatepass/
├── app/
│   ├── (public)/
│   │   ├── page.tsx                  # Landing page
│   │   └── events/[slug]/
│   │       ├── page.tsx              # Public event page
│   │       └── register/page.tsx     # Registration form
│   ├── (auth)/
│   │   ├── login/page.tsx
│   │   └── signup/page.tsx
│   └── (dashboard)/
│       ├── dashboard/page.tsx
│       └── events/
│           ├── create/page.tsx
│           └── [slug]/manage/
│               ├── page.tsx
│               └── checkin/page.tsx
├── api/
│   ├── register/route.ts
│   ├── checkin/route.ts
│   ├── email/route.ts
│   ├── analytics/route.ts
│   └── webhooks/
│       └── razorpay/route.ts
├── components/
│   ├── ui/                           # shadcn/ui components
│   ├── events/
│   ├── registration/
│   ├── checkin/
│   └── dashboard/
├── lib/
│   ├── supabase/
│   │   ├── client.ts
│   │   └── server.ts
│   ├── razorpay.ts
│   ├── resend.ts
│   └── utils.ts
├── supabase/
│   └── migrations/
│       └── 001_initial_schema.sql
├── ARCHITECTURE.md                   # This file
├── CONTRIBUTING.md
├── README.md
└── LICENSE                           # MIT
```

---

## Why Gatepass?

MakeMyPass charges **4.72% platform fee + 2.36% gateway fee = 7%+ per transaction.**

For a college fest with 2,000 attendees at ₹500/ticket:
- MakeMyPass takes: **₹70,000+**
- Gatepass takes: **₹0**

Gatepass is MIT licensed, self-hostable, and free forever for organizers.

---

*Built for Indian college communities. Open to the world.*
