# Ticketing Summary — Gatepass

## Files Created
- `lib/qr.ts` — QR utilities: `generateQRDataURL(text)` → base64 data URL; `generateQRBuffer(text)` → PNG Buffer. Both use 300×300, margin 2, error correction 'M'.
- `app/api/tickets/route.ts` — `POST /api/tickets` for simplified internal ticket creation (no capacity check, no Razorpay, always `status: confirmed`, `payment_status: free`).
- `app/api/validate/route.ts` — `POST /api/validate` for QR validation without recording a check-in. No auth required.
- `app/ticket/[id]/page.tsx` — Server component attendee ticket view using `registration.id` as the URL param; renders event info, attendee details, status badges, and embedded QR code.

## `/api/validate` Response Shape (for Scanner Agent)
```json
// Valid, not yet checked in:
{ "valid": true, "attendee_name": "string", "ticket_type": "string", "status": "confirmed|pending|waitlisted|cancelled", "already_checked_in": false, "checked_in_at": null }

// Valid, already checked in:
{ "valid": true, "attendee_name": "string", "ticket_type": "string", "status": "confirmed", "already_checked_in": true, "checked_in_at": "ISO timestamp" }

// Not found:
{ "valid": false }

// Bad request (missing fields):
{ "valid": false, "error": "Missing qr_code or event_id" }  // HTTP 400

// Server error:
{ "valid": false, "error": "..." }  // HTTP 500
```

## `/api/tickets` Response Shape (for Wiring Agent)
```json
// Success (HTTP 200):
{ "success": true, "registration_id": "uuid", "qr_code": "uuid", "ticket_type_name": "string" }

// Errors (HTTP 400/404/500):
{ "error": "string" }
```
Request body: `{ event_id, ticket_type_id, attendee_name, attendee_email, attendee_phone? }`

## Assumptions / Deviations
- `/api/validate` uses `maybeSingle()` for check_ins — if a registration has multiple check-in rows (shouldn't happen by schema design) only the first is returned; `already_checked_in` will be `true` either way.
- The `ticket_types` and `events` join fields from Supabase come back as objects (not arrays) for `.single()`/`.maybeSingle()` selects; type-narrowing guards handle this in both the API and the page component.

## Notes for Scanner / Wiring Agents
- The existing `POST /api/checkin` is the authoritative check-in endpoint (requires organizer JWT, records `check_ins` row). `/api/validate` is read-only and auth-free — use it for pre-scan preview or offline-capable scanners.
- Ticket page URL pattern: `/ticket/[registration.id]` — link can be shared directly with attendees.
- `lib/qr.ts` is safe to import in both server components and API routes (Node.js `qrcode` package, not browser-only).
