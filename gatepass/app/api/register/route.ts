import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { sendConfirmationEmail } from "@/lib/resend";
import { createRazorpayOrder, razorpayKeyId } from "@/lib/razorpay";
import { formatDate } from "@/lib/utils";
import type { RegisterPayload } from "@/types";
import { randomUUID } from "crypto";

export async function POST(request: NextRequest) {
  try {
    const body: RegisterPayload = await request.json();
    const { event_id, ticket_type_id, attendee_name, attendee_email, attendee_phone, form_data } = body;

    // Basic validation
    if (!event_id || !ticket_type_id || !attendee_name || !attendee_email) {
      return NextResponse.json({ error: "Missing required fields" }, { status: 400 });
    }

    // Use service-role client to bypass RLS for capacity check + insert
    const supabase = createClient();

    // 1. Fetch event + ticket type
    const { data: event, error: eventErr } = await supabase
      .from("events")
      .select("id, title, slug, venue, start_date, status, registration_start, registration_end, capacity")
      .eq("id", event_id)
      .single();

    if (eventErr || !event) {
      return NextResponse.json({ error: "Event not found" }, { status: 404 });
    }
    if (event.status !== "published") {
      return NextResponse.json({ error: "Event is not open for registration" }, { status: 400 });
    }

    const { data: ticket, error: ticketErr } = await supabase
      .from("ticket_types")
      .select("id, name, price, capacity, is_active")
      .eq("id", ticket_type_id)
      .eq("event_id", event_id)
      .single();

    if (ticketErr || !ticket || !ticket.is_active) {
      return NextResponse.json({ error: "Ticket type not found or unavailable" }, { status: 404 });
    }

    // 2. Check for duplicate registration
    const { data: existing } = await supabase
      .from("registrations")
      .select("id")
      .eq("event_id", event_id)
      .eq("attendee_email", attendee_email)
      .in("status", ["confirmed", "pending", "waitlisted"])
      .maybeSingle();

    if (existing) {
      return NextResponse.json({ error: "This email is already registered for this event" }, { status: 409 });
    }

    // 3. Check capacity — count confirmed + pending registrations for this ticket type
    let registrationStatus: "confirmed" | "waitlisted" = "confirmed";
    if (ticket.capacity !== null) {
      const { count } = await supabase
        .from("registrations")
        .select("id", { count: "exact", head: true })
        .eq("ticket_type_id", ticket_type_id)
        .in("status", ["confirmed", "pending"]);

      if ((count ?? 0) >= ticket.capacity) {
        registrationStatus = "waitlisted";
      }
    }

    // 4. Insert registration
    const { data: registration, error: regErr } = await supabase
      .from("registrations")
      .insert({
        event_id,
        ticket_type_id,
        attendee_name,
        attendee_email,
        attendee_phone: attendee_phone ?? null,
        form_data: form_data ?? {},
        status: registrationStatus,
        payment_status: ticket.price === 0 ? "free" : "pending",
        qr_code: randomUUID(),
      })
      .select()
      .single();

    if (regErr || !registration) {
      console.error("Registration insert error:", regErr);
      return NextResponse.json({ error: "Failed to create registration" }, { status: 500 });
    }

    // 5. Handle paid tickets — create Razorpay order
    let razorpayOrder = null;
    if (ticket.price > 0 && registrationStatus === "confirmed") {
      try {
        razorpayOrder = await createRazorpayOrder({
          amount: ticket.price,
          receipt: registration.id,
          notes: {
            event_id,
            registration_id: registration.id,
            attendee_email,
          },
        });

        // Save order ID to registration
        await supabase
          .from("registrations")
          .update({ razorpay_order_id: razorpayOrder.id })
          .eq("id", registration.id);
      } catch (err) {
        console.error("Razorpay order error:", err);
        // Rollback registration
        await supabase.from("registrations").delete().eq("id", registration.id);
        return NextResponse.json({ error: "Payment initialization failed" }, { status: 500 });
      }
    }

    // 6. Send confirmation email for free / waitlisted tickets
    if (ticket.price === 0) {
      try {
        await sendConfirmationEmail({
          to: attendee_email,
          attendeeName: attendee_name,
          eventTitle: event.title,
          eventDate: formatDate(event.start_date),
          eventVenue: event.venue ?? "Venue TBD",
          ticketType: ticket.name,
          qrCode: registration.qr_code,
          eventSlug: event.slug,
        });
      } catch (emailErr) {
        console.error("Email send error (non-fatal):", emailErr);
      }
    }

    return NextResponse.json({
      success: true,
      registration_id: registration.id,
      status: registrationStatus,
      qr_code: ticket.price === 0 ? registration.qr_code : undefined,
      payment_required: ticket.price > 0 && registrationStatus === "confirmed",
      razorpay_order_id: razorpayOrder?.id,
      razorpay_key_id: razorpayOrder ? razorpayKeyId : undefined,
      amount: ticket.price,
    });
  } catch (err) {
    console.error("Register API error:", err);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
