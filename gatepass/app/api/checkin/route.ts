import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import type { CheckinPayload, CheckinResult } from "@/types";

export async function POST(request: NextRequest) {
  try {
    const body: CheckinPayload = await request.json();
    const { qr_code, event_id } = body;

    if (!qr_code || !event_id) {
      return NextResponse.json<CheckinResult>(
        { success: false, message: "Missing qr_code or event_id" },
        { status: 400 }
      );
    }

    const supabase = createClient();

    // Authenticate organizer
    const { data: { user }, error: authErr } = await supabase.auth.getUser();
    if (authErr || !user) {
      return NextResponse.json<CheckinResult>(
        { success: false, message: "Unauthorized" },
        { status: 401 }
      );
    }

    // Verify organizer owns this event
    const { data: event } = await supabase
      .from("events")
      .select("id, organizer_id")
      .eq("id", event_id)
      .eq("organizer_id", user.id)
      .single();

    if (!event) {
      return NextResponse.json<CheckinResult>(
        { success: false, message: "Event not found or access denied" },
        { status: 403 }
      );
    }

    // Find registration by QR code
    const { data: registration } = await supabase
      .from("registrations")
      .select("id, attendee_name, status, ticket_type_id, ticket_types(name)")
      .eq("qr_code", qr_code)
      .eq("event_id", event_id)
      .maybeSingle();

    if (!registration) {
      return NextResponse.json<CheckinResult>(
        { success: false, message: "Invalid QR code" },
        { status: 404 }
      );
    }

    if (registration.status !== "confirmed") {
      return NextResponse.json<CheckinResult>({
        success: false,
        message:
          registration.status === "waitlisted"
            ? "Attendee is on the waitlist"
            : registration.status === "cancelled"
            ? "Registration was cancelled"
            : "Registration is not confirmed",
      });
    }

    // Check for existing check-in
    const { data: existing } = await supabase
      .from("check_ins")
      .select("id, checked_in_at")
      .eq("registration_id", registration.id)
      .maybeSingle();

    if (existing) {
      return NextResponse.json<CheckinResult>({
        success: false,
        already_checked_in: true,
        message: `Already checked in at ${new Date(existing.checked_in_at).toLocaleTimeString("en-IN")}`,
        attendee_name: registration.attendee_name,
        ticket_type: (registration.ticket_types as unknown as { name: string } | null)?.name,
      });
    }

    // Insert check-in record
    const { error: checkinErr } = await supabase.from("check_ins").insert({
      registration_id: registration.id,
      checked_in_by: user.id,
    });

    if (checkinErr) {
      // Handle unique constraint violation (race condition — already checked in)
      if (checkinErr.code === "23505") {
        return NextResponse.json<CheckinResult>({
          success: false,
          already_checked_in: true,
          message: "Already checked in",
          attendee_name: registration.attendee_name,
        });
      }
      console.error("Check-in insert error:", checkinErr);
      return NextResponse.json<CheckinResult>(
        { success: false, message: "Check-in failed, please try again" },
        { status: 500 }
      );
    }

    return NextResponse.json<CheckinResult>({
      success: true,
      message: "Check-in successful!",
      attendee_name: registration.attendee_name,
      ticket_type: (registration.ticket_types as unknown as { name: string } | null)?.name,
    });
  } catch (err) {
    console.error("Checkin API error:", err);
    return NextResponse.json<CheckinResult>(
      { success: false, message: "Internal server error" },
      { status: 500 }
    );
  }
}
