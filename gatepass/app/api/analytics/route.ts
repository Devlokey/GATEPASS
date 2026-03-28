import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import type { EventAnalytics, RegistrationStatus, PaymentStatus } from "@/types";

type CsvReg = {
  attendee_name: string;
  attendee_email: string;
  attendee_phone: string | null;
  status: RegistrationStatus;
  payment_status: PaymentStatus;
  created_at: string;
  ticket_types: { name: string } | null;
  check_ins: { checked_in_at: string }[];
};

type AnalyticsReg = {
  status: RegistrationStatus;
  payment_status: PaymentStatus;
  ticket_type_id: string | null;
  ticket_types: { id: string; name: string; price: number } | null;
  check_ins: { id: string }[];
};

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const event_id = searchParams.get("event_id");
    const format = searchParams.get("format"); // "csv" or default json

    if (!event_id) {
      return NextResponse.json({ error: "event_id is required" }, { status: 400 });
    }

    const supabase = createClient();

    // Auth check
    const { data: { user }, error: authErr } = await supabase.auth.getUser();
    if (authErr || !user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    // Verify organizer owns event
    const { data: event } = await supabase
      .from("events")
      .select("id, organizer_id, title")
      .eq("id", event_id)
      .eq("organizer_id", user.id)
      .single();

    if (!event) {
      return NextResponse.json({ error: "Event not found or access denied" }, { status: 403 });
    }

    // ── CSV Export ──────────────────────────────────────────
    if (format === "csv") {
      const { data: registrations } = await supabase
        .from("registrations")
        .select("id, attendee_name, attendee_email, attendee_phone, status, payment_status, created_at, ticket_types(name), check_ins(checked_in_at)")
        .eq("event_id", event_id)
        .order("created_at", { ascending: true });

      if (!registrations) {
        return NextResponse.json({ error: "No registrations found" }, { status: 404 });
      }

      const headers = ["Name", "Email", "Phone", "Ticket", "Status", "Payment", "Checked In", "Registered At"];
      const rows = (registrations as unknown as CsvReg[]).map((r) => [
        r.attendee_name,
        r.attendee_email,
        r.attendee_phone ?? "",
        r.ticket_types?.name ?? "",
        r.status,
        r.payment_status,
        r.check_ins?.length > 0 ? new Date(r.check_ins[0].checked_in_at).toLocaleString("en-IN") : "No",
        new Date(r.created_at).toLocaleString("en-IN"),
      ]);

      const csv = [headers, ...rows]
        .map((row) => row.map((v: string) => `"${String(v).replace(/"/g, '""')}"`).join(","))
        .join("\n");

      return new NextResponse(csv, {
        headers: {
          "Content-Type": "text/csv; charset=utf-8",
          "Content-Disposition": `attachment; filename="gatepass-${event_id}-registrations.csv"`,
        },
      });
    }

    // ── JSON Analytics ──────────────────────────────────────
    const { data: registrations } = await supabase
      .from("registrations")
      .select("id, status, payment_status, ticket_type_id, ticket_types(id, name, price), check_ins(id)")
      .eq("event_id", event_id);

    if (!registrations) {
      return NextResponse.json({ error: "Failed to fetch analytics" }, { status: 500 });
    }

    const byTicketType: Record<string, { ticket_type_id: string; name: string; count: number; revenue_paise: number }> = {};

    let total = 0, confirmed = 0, waitlisted = 0, cancelled = 0, checkedIn = 0, revenue = 0;

    for (const r of registrations as unknown as AnalyticsReg[]) {
      total++;
      if (r.status === "confirmed") confirmed++;
      if (r.status === "waitlisted") waitlisted++;
      if (r.status === "cancelled") cancelled++;
      if (r.check_ins?.length > 0) checkedIn++;

      const paid = r.payment_status === "paid" ? (r.ticket_types?.price ?? 0) : 0;
      revenue += paid;

      const ttId = r.ticket_type_id ?? "unknown";
      if (!byTicketType[ttId]) {
        byTicketType[ttId] = {
          ticket_type_id: ttId,
          name: r.ticket_types?.name ?? "Unknown",
          count: 0,
          revenue_paise: 0,
        };
      }
      byTicketType[ttId].count++;
      byTicketType[ttId].revenue_paise += paid;
    }

    const analytics: EventAnalytics = {
      total_registrations: total,
      confirmed,
      waitlisted,
      cancelled,
      checked_in: checkedIn,
      revenue_paise: revenue,
      by_ticket_type: Object.values(byTicketType),
    };

    return NextResponse.json(analytics);
  } catch (err) {
    console.error("Analytics API error:", err);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
