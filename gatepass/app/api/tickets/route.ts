import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { randomUUID } from "crypto";

// POST /api/tickets
// Simplified ticket creation for internal/admin use.
// Full production registration (capacity check, Razorpay) is in /api/register.
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { event_id, ticket_type_id, attendee_name, attendee_email, attendee_phone } = body;

    if (!event_id || !ticket_type_id || !attendee_name || !attendee_email) {
      return NextResponse.json({ error: "Missing required fields" }, { status: 400 });
    }

    const supabase = createClient();

    // Fetch ticket type to get the name for response
    const { data: ticketType, error: ticketErr } = await supabase
      .from("ticket_types")
      .select("id, name, is_active")
      .eq("id", ticket_type_id)
      .eq("event_id", event_id)
      .single();

    if (ticketErr || !ticketType) {
      return NextResponse.json({ error: "Ticket type not found" }, { status: 404 });
    }

    if (!ticketType.is_active) {
      return NextResponse.json({ error: "Ticket type is not active" }, { status: 400 });
    }

    const qr_code = randomUUID();

    const { data: registration, error: regErr } = await supabase
      .from("registrations")
      .insert({
        event_id,
        ticket_type_id,
        attendee_name,
        attendee_email,
        attendee_phone: attendee_phone ?? null,
        form_data: {},
        status: "confirmed",
        payment_status: "free",
        qr_code,
      })
      .select("id")
      .single();

    if (regErr || !registration) {
      console.error("Ticket insert error:", regErr);
      return NextResponse.json({ error: "Failed to create ticket" }, { status: 500 });
    }

    return NextResponse.json({
      success: true,
      registration_id: registration.id,
      qr_code,
      ticket_type_name: ticketType.name,
    });
  } catch (err) {
    console.error("Tickets API error:", err);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
