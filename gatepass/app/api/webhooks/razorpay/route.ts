import { NextRequest, NextResponse } from "next/server";

type EventInfo = { title: string; slug: string; venue: string | null; start_date: string | null };
type TicketInfo = { name: string } | null;
import { createClient } from "@/lib/supabase/server";
import { verifyWebhookSignature } from "@/lib/razorpay";
import { sendConfirmationEmail } from "@/lib/resend";
import { formatDate } from "@/lib/utils";

export async function POST(request: NextRequest) {
  try {
    const rawBody = await request.text();
    const signature = request.headers.get("x-razorpay-signature");

    if (!signature) {
      return NextResponse.json({ error: "Missing signature" }, { status: 400 });
    }

    // Verify webhook authenticity
    const isValid = verifyWebhookSignature(rawBody, signature);
    if (!isValid) {
      return NextResponse.json({ error: "Invalid signature" }, { status: 401 });
    }

    const payload = JSON.parse(rawBody);
    const event = payload.event as string;
    const paymentEntity = payload.payload?.payment?.entity;

    // We only care about successful payments
    if (event !== "payment.captured" || !paymentEntity) {
      return NextResponse.json({ received: true });
    }

    const { order_id, id: payment_id, amount } = paymentEntity;

    const supabase = createClient();

    // Find registration by razorpay_order_id
    const { data: registration } = await supabase
      .from("registrations")
      .select("id, attendee_name, attendee_email, event_id, ticket_type_id, ticket_types(name), qr_code, events(title, slug, venue, start_date)")
      .eq("razorpay_order_id", order_id)
      .single();

    if (!registration) {
      console.error("No registration found for order:", order_id);
      return NextResponse.json({ received: true });
    }

    // Update registration
    await supabase
      .from("registrations")
      .update({
        status: "confirmed",
        payment_status: "paid",
        razorpay_payment_id: payment_id,
      })
      .eq("id", registration.id);

    // Upsert payment record
    await supabase.from("payments").upsert({
      registration_id: registration.id,
      razorpay_order_id: order_id,
      razorpay_payment_id: payment_id,
      amount,
      status: "paid",
      webhook_payload: payload,
    });

    // Send confirmation email
    const ev = (registration.events as unknown as EventInfo | null);
    try {
      await sendConfirmationEmail({
        to: registration.attendee_email,
        attendeeName: registration.attendee_name,
        eventTitle: ev?.title ?? "Your Event",
        eventDate: formatDate(ev?.start_date ?? null),
        eventVenue: ev?.venue ?? "Venue TBD",
        ticketType: (registration.ticket_types as unknown as TicketInfo)?.name ?? "General",
        qrCode: registration.qr_code,
        eventSlug: ev?.slug ?? "",
      });
    } catch (emailErr) {
      console.error("Post-payment email error (non-fatal):", emailErr);
    }

    return NextResponse.json({ received: true });
  } catch (err) {
    console.error("Razorpay webhook error:", err);
    return NextResponse.json({ error: "Webhook processing failed" }, { status: 500 });
  }
}
