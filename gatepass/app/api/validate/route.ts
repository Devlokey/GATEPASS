import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";

// POST /api/validate
// Validates a QR code and returns attendee info WITHOUT recording a check-in.
// No auth required — intended for scanner app use.
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { qr_code, event_id } = body;

    if (!qr_code || !event_id) {
      return NextResponse.json({ valid: false, error: "Missing qr_code or event_id" }, { status: 400 });
    }

    const supabase = createClient();

    // Look up registration by qr_code + event_id
    const { data: registration, error: regErr } = await supabase
      .from("registrations")
      .select("id, attendee_name, status, ticket_type_id, ticket_types(name)")
      .eq("qr_code", qr_code)
      .eq("event_id", event_id)
      .maybeSingle();

    if (regErr) {
      console.error("Validate lookup error:", regErr);
      return NextResponse.json({ valid: false, error: "Lookup failed" }, { status: 500 });
    }

    if (!registration) {
      return NextResponse.json({ valid: false });
    }

    // Check if already checked in
    const { data: checkIn, error: checkInErr } = await supabase
      .from("check_ins")
      .select("checked_in_at")
      .eq("registration_id", registration.id)
      .maybeSingle();

    if (checkInErr) {
      console.error("Check-in lookup error:", checkInErr);
      // Non-fatal — still return valid result without check-in info
    }

    const ticketTypeName =
      registration.ticket_types && typeof registration.ticket_types === "object" && !Array.isArray(registration.ticket_types)
        ? (registration.ticket_types as { name: string }).name
        : undefined;

    return NextResponse.json({
      valid: true,
      attendee_name: registration.attendee_name,
      ticket_type: ticketTypeName,
      status: registration.status,
      already_checked_in: checkIn != null,
      checked_in_at: checkIn?.checked_in_at ?? null,
    });
  } catch (err) {
    console.error("Validate API error:", err);
    return NextResponse.json({ valid: false, error: "Internal server error" }, { status: 500 });
  }
}
