import { NextRequest, NextResponse } from "next/server";

type EventInfo = { id: string; title: string; slug: string; venue: string | null; start_date: string | null; organizer_id: string };
type TicketInfo = { name: string } | null;
import { createClient } from "@/lib/supabase/server";
import {
  sendConfirmationEmail,
  sendReminderEmail,
  sendWaitlistPromotionEmail,
} from "@/lib/resend";
import { formatDate } from "@/lib/utils";

// POST /api/email
// Body: { type: "confirmation" | "reminder" | "waitlist", registration_id: string }
// Organizer JWT required

export async function POST(request: NextRequest) {
  try {
    const { type, registration_id } = await request.json();

    if (!type || !registration_id) {
      return NextResponse.json({ error: "Missing type or registration_id" }, { status: 400 });
    }

    const supabase = createClient();

    // Auth check — organizer only
    const { data: { user }, error: authErr } = await supabase.auth.getUser();
    if (authErr || !user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    // Fetch registration + event info
    const { data: registration } = await supabase
      .from("registrations")
      .select(
        "id, attendee_name, attendee_email, qr_code, status, ticket_types(name), events(id, title, slug, venue, start_date, organizer_id)"
      )
      .eq("id", registration_id)
      .single();

    if (!registration) {
      return NextResponse.json({ error: "Registration not found" }, { status: 404 });
    }

    const ev = (registration.events as unknown as EventInfo | null);

    // Verify the requesting user owns this event
    if (ev?.organizer_id !== user.id) {
      return NextResponse.json({ error: "Access denied" }, { status: 403 });
    }

    const commonParams = {
      to: registration.attendee_email,
      attendeeName: registration.attendee_name,
      eventTitle: ev?.title ?? "Your Event",
      eventSlug: ev?.slug ?? "",
      qrCode: registration.qr_code,
    };

    if (type === "confirmation") {
      await sendConfirmationEmail({
        ...commonParams,
        eventDate: formatDate(ev?.start_date),
        eventVenue: ev?.venue ?? "Venue TBD",
        ticketType: (registration.ticket_types as unknown as TicketInfo)?.name ?? "General",
      });
    } else if (type === "reminder") {
      await sendReminderEmail({
        ...commonParams,
        eventDate: formatDate(ev?.start_date),
        eventVenue: ev?.venue ?? "Venue TBD",
      });
    } else if (type === "waitlist") {
      await sendWaitlistPromotionEmail(commonParams);
    } else {
      return NextResponse.json({ error: "Invalid email type" }, { status: 400 });
    }

    return NextResponse.json({ success: true });
  } catch (err) {
    console.error("Email API error:", err);
    return NextResponse.json({ error: "Failed to send email" }, { status: 500 });
  }
}
