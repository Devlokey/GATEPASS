<div align="center">

<img src="[https://raw.githubusercontent.com/your-username/gatepass/main/public/logo.png](https://github.com/Devlokey/GATEPASS/blob/main/Gatepass.png?raw=true)" alt="Gatepass Logo" width="80" />

# Gatepass

**The free, open-source event management platform built for Indian colleges.**

MakeMyPass charges 7%+ per ticket. We charge zero.

[![MIT License](https://img.shields.io/badge/License-MIT-green.svg)](LICENSE)
[![Next.js](https://img.shields.io/badge/Next.js-14-black)](https://nextjs.org)
[![Supabase](https://img.shields.io/badge/Supabase-Database-3ECF8E)](https://supabase.com)
[![Deploy on Vercel](https://img.shields.io/badge/Deploy-Vercel-black)](https://vercel.com)

[Live Demo](https://gatepass.vercel.app) · [Architecture](ARCHITECTURE.md) · [Contributing](CONTRIBUTING.md)

</div>

---

## The Problem

Every college fest in India pays a tax it doesn't know about.

MakeMyPass — the dominant event platform — charges **4.72% platform fee + 2.36% gateway fee** on every ticket sold.

For a 2,000-person fest at ₹500/ticket:

| Platform | Fee |
|---|---|
| MakeMyPass | ₹70,800 gone |
| Gatepass | ₹0 |

That money belongs to the organizers. Gatepass gives it back.

---

## What Gatepass Does

- **Event Pages** — Beautiful public pages with banner, description, and registration
- **Ticketing** — Free and paid ticket types, capacity limits, waitlisting
- **Custom Forms** — Drag-and-drop form builder for attendee data
- **QR Check-in** — Camera-based QR scanning at the venue, built for mobile
- **Payments** — Razorpay integration, just pass the gateway cost (no platform cut)
- **Analytics** — Real-time registrations, attendance tracking, CSV export
- **Email** — Confirmation emails with QR codes, event reminders
- **Organizer Dashboard** — Manage everything from one place

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
| Hosting | Vercel (free tier) |

---

## Self-Hosting Guide

### Prerequisites

- Node.js 18+
- A [Supabase](https://supabase.com) account (free)
- A [Resend](https://resend.com) account (free)
- A [Razorpay](https://razorpay.com) account (for paid events)
- A [Vercel](https://vercel.com) account (free)

### 1. Clone the repo

```bash
git clone https://github.com/your-username/gatepass.git
cd gatepass
npm install
```

### 2. Set up Supabase

1. Create a new project at [supabase.com](https://supabase.com)
2. Go to **SQL Editor** and run the migration:

```bash
# Copy the contents of supabase/migrations/001_initial_schema.sql
# Paste and run in Supabase SQL Editor
```

3. Go to **Settings → API** and copy your project URL and anon key

### 3. Configure environment variables

```bash
cp .env.local.example .env.local
```

Fill in your `.env.local`:

```bash
# Supabase
NEXT_PUBLIC_SUPABASE_URL=https://your-project.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=your-anon-key
SUPABASE_SERVICE_ROLE_KEY=your-service-role-key

# Resend (email)
RESEND_API_KEY=re_your_api_key

# Razorpay (only needed for paid events)
RAZORPAY_KEY_ID=rzp_live_your_key
RAZORPAY_KEY_SECRET=your_secret
RAZORPAY_WEBHOOK_SECRET=your_webhook_secret

# App
NEXT_PUBLIC_APP_URL=http://localhost:3000
```

### 4. Run locally

```bash
npm run dev
```

Open [http://localhost:3000](http://localhost:3000)

### 5. Deploy to Vercel

```bash
npx vercel
```

Add your environment variables in the Vercel dashboard under **Settings → Environment Variables**.

---

## Scaling

| Service | Free Tier | What It Handles |
|---|---|---|
| Supabase | 50,000 DB rows | ~5,000–10,000 registrations |
| Vercel | Unlimited requests | Any traffic volume |
| Resend | 3,000 emails/month | ~100 events |

Need more? Supabase Pro ($25/mo) + Resend paid ($20/mo) handles **lakhs of registrations** for less than what MakeMyPass charges on a single 500-person event.

---

## Project Structure

```
gatepass/
├── app/
│   ├── (public)/           # Landing page, event pages
│   ├── (auth)/             # Login, signup
│   └── (dashboard)/        # Organizer dashboard
├── api/
│   ├── register/           # Registration handler
│   ├── checkin/            # QR check-in
│   ├── email/              # Email triggers
│   └── webhooks/razorpay/  # Payment webhooks
├── components/
│   ├── ui/                 # shadcn/ui base components
│   ├── events/
│   ├── registration/
│   └── dashboard/
├── lib/
│   ├── supabase/
│   ├── razorpay.ts
│   └── resend.ts
├── supabase/
│   └── migrations/
│       └── 001_initial_schema.sql
├── ARCHITECTURE.md
├── CONTRIBUTING.md
└── LICENSE
```

---

## Roadmap

- [x] Event creation + public pages
- [x] Ticketing system (free + paid)
- [x] QR code check-in
- [x] Razorpay payments
- [x] Email confirmations
- [x] Organizer analytics
- [ ] WhatsApp notifications
- [ ] Multi-organizer teams
- [ ] Sponsor management
- [ ] Mobile app (React Native)
- [ ] Custom domain support

---

## Contributing

Gatepass is open to contributions. See [CONTRIBUTING.md](CONTRIBUTING.md) to get started.

Built something on top of Gatepass? Open a PR to add it to the showcase.

---

## Why Open Source?

Event management software shouldn't extract value from student organizers.

College fests run on zero budgets. Every rupee that goes to a platform fee is a rupee that doesn't go toward speakers, decorations, or experiences. Gatepass exists to fix that — permanently.

MIT licensed. Fork it. Host it. Make it yours.

---

## License

[MIT](LICENSE) © 2026 Gatepass Contributors

---

<div align="center">

Built with ♥ for Indian college communities

**Star the repo if Gatepass saves your fest money ⭐**

</div>
