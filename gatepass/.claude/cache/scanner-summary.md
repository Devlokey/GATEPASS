# Scanner Summary — Gatepass

## Files Created
- `components/scanner/QRReader.tsx` — `'use client'` component wrapping `html5-qrcode`; props: `{ onScan: (qrCode: string) => void }`
- `components/scanner/TicketResult.tsx` — `'use client'` display card; props: `{ result: ResultData | null; onDismiss: () => void }`
- `app/scan/page.tsx` — `'use client'` full scanner page; state: `eventId`, `result`, `loading`

## Component Props
- `QRReader`: `onScan(qrCode: string)` — called after each successful decode, with a 3 s `scanPaused` ref gate preventing back-to-back scans
- `TicketResult`: `result: ResultData | null` (fields: `valid`, `attendee_name?`, `ticket_type?`, `already_checked_in?`, `checked_in_at?`, `message?`) + `onDismiss: () => void`; auto-dismisses after 4 s via `useEffect`

## Validate + Checkin Sequencing
1. `POST /api/validate` is always called first (read-only, no auth)
2. Only if `valid === true && already_checked_in === false` is `POST /api/checkin` called
3. Final `result` state is built from the checkin response (merged with validate fallbacks) when checkin ran, or from validate directly otherwise

## Deviations
- `QRReader` renders `<div id="qr-reader-box" />` (as specified); `html5-qrcode` injects its own UI elements inside that div — no external CSS imported
- `app/scan/page.tsx` does not import `ResultData` from a shared types file; the interface is declared inline (no shared types module exists yet)
