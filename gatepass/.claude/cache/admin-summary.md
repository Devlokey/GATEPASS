# Admin Summary — Gatepass

## Files Created
- `app/dashboard/events/page.tsx` — Server component event list page; auth-guarded, fetches events with ticket_types + registrations joins, renders event cards with status badge, capacity bar, view/manage links, and empty state.
- `app/dashboard/events/new/page.tsx` — Redirect shim: immediately redirects to `/events/create`.
- `app/api/events/route.ts` — REST CRUD for events: GET (list), POST (create), PATCH (update), DELETE (by ?id=). All handlers verify auth; PATCH and DELETE verify organizer ownership (403 on mismatch, 404 on missing).
- `lib/events.ts` — Server-side helpers: `getOrganizerEvents`, `getEventBySlug`, `getEventById`, `isSlugTaken`.

## Event ID Field Name
The primary key on the `events` table is **`id`** (UUID). Foreign key in `ticket_types` and `registrations` referencing it is **`event_id`**.

## Assumptions / Deviations
- Files created at `app/dashboard/events/` (no route group parens) as specified — this is a separate Next.js route from `app/(dashboard)/`. The wiring agent may need to add a layout or ensure middleware protects `/dashboard` sub-paths.
- `getOrganizerEvents` computes `registration_count` in JS from the fetched registrations array (confirmed + pending only); `checkin_count` is not populated (not joined — would require a separate `check_ins` join).
- `form_fields` is selected in `getOrganizerEvents` and `getEventBySlug` to fully satisfy the `EventWithDetails` type.

## Wiring Agent Notes
- The `/dashboard/events` route lives outside the `(dashboard)` route group, so it has no shared dashboard layout automatically. If a shared layout/nav is needed, either move files into `(dashboard)` or add a `app/dashboard/layout.tsx`.
- Middleware already protects `/dashboard` and sub-paths per auth-summary.md, so auth redirect is handled at both middleware and page level.
- `lib/events.ts` helpers are ready for use by Ticketing Agent and any other server component that needs event lookups.
