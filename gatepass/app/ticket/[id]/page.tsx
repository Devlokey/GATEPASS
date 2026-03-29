import { createClient } from "@/lib/supabase/server";
import { generateQRDataURL } from "@/lib/qr";
import type { RegistrationStatus, PaymentStatus } from "@/types";

interface TicketPageProps {
  params: { id: string };
}

function statusBadgeStyle(status: RegistrationStatus): React.CSSProperties {
  const base: React.CSSProperties = {
    display: "inline-block",
    padding: "4px 12px",
    borderRadius: "9999px",
    fontSize: "13px",
    fontWeight: 600,
    textTransform: "uppercase",
    letterSpacing: "0.05em",
  };
  switch (status) {
    case "confirmed":
      return { ...base, background: "#d1fae5", color: "#065f46" };
    case "waitlisted":
      return { ...base, background: "#fef3c7", color: "#92400e" };
    case "cancelled":
      return { ...base, background: "#fee2e2", color: "#991b1b" };
    default:
      return { ...base, background: "#e5e7eb", color: "#374151" };
  }
}

function paymentBadgeStyle(paymentStatus: PaymentStatus): React.CSSProperties {
  const base: React.CSSProperties = {
    display: "inline-block",
    padding: "3px 10px",
    borderRadius: "9999px",
    fontSize: "12px",
    fontWeight: 500,
  };
  switch (paymentStatus) {
    case "free":
      return { ...base, background: "#ede9fe", color: "#5b21b6" };
    case "paid":
      return { ...base, background: "#d1fae5", color: "#065f46" };
    case "pending":
      return { ...base, background: "#fef3c7", color: "#92400e" };
    default:
      return { ...base, background: "#e5e7eb", color: "#374151" };
  }
}

function formatDateDisplay(dateStr: string | null): string {
  if (!dateStr) return "Date TBD";
  const d = new Date(dateStr);
  return d.toLocaleDateString("en-IN", {
    day: "numeric",
    month: "long",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  });
}

export default async function TicketPage({ params }: TicketPageProps) {
  const { id } = params;
  const supabase = createClient();

  const { data: registration } = await supabase
    .from("registrations")
    .select(
      "id, attendee_name, attendee_email, status, payment_status, qr_code, ticket_types(name), events(title, slug, venue, start_date, banner_url)"
    )
    .eq("id", id)
    .maybeSingle();

  if (!registration) {
    return (
      <main style={{ minHeight: "100vh", display: "flex", alignItems: "center", justifyContent: "center", background: "#f9fafb", fontFamily: "sans-serif" }}>
        <div style={{ textAlign: "center", padding: "40px" }}>
          <div style={{ fontSize: "64px", marginBottom: "16px" }}>🎫</div>
          <h1 style={{ fontSize: "24px", color: "#111827", marginBottom: "8px" }}>Ticket not found</h1>
          <p style={{ color: "#6b7280" }}>This ticket link may be invalid or expired.</p>
        </div>
      </main>
    );
  }

  const ticketTypeName =
    registration.ticket_types && typeof registration.ticket_types === "object" && !Array.isArray(registration.ticket_types)
      ? (registration.ticket_types as { name: string }).name
      : "General";

  const event =
    registration.events && typeof registration.events === "object" && !Array.isArray(registration.events)
      ? (registration.events as { title: string; slug: string; venue: string | null; start_date: string | null; banner_url: string | null })
      : null;

  const qrDataUrl = await generateQRDataURL(registration.qr_code);

  return (
    <main style={{ minHeight: "100vh", background: "#f3f4f6", fontFamily: "system-ui, sans-serif", padding: "24px 16px" }}>
      <div style={{ maxWidth: "480px", margin: "0 auto" }}>

        {/* Event banner */}
        {event?.banner_url && (
          <img
            src={event.banner_url}
            alt={event.title}
            style={{ width: "100%", height: "180px", objectFit: "cover", borderRadius: "12px 12px 0 0" }}
          />
        )}

        {/* Ticket card */}
        <div style={{
          background: "#ffffff",
          borderRadius: event?.banner_url ? "0 0 12px 12px" : "12px",
          boxShadow: "0 4px 16px rgba(0,0,0,0.08)",
          overflow: "hidden",
        }}>
          {/* Header */}
          <div style={{ background: "#4f46e5", padding: "24px", color: "#ffffff" }}>
            <p style={{ fontSize: "12px", textTransform: "uppercase", letterSpacing: "0.1em", opacity: 0.8, marginBottom: "6px" }}>
              Your Ticket
            </p>
            <h1 style={{ fontSize: "22px", fontWeight: 700, margin: 0, lineHeight: 1.3 }}>
              {event?.title ?? "Event"}
            </h1>
          </div>

          {/* Event details */}
          <div style={{ padding: "20px 24px", borderBottom: "1px solid #e5e7eb" }}>
            {event?.start_date && (
              <div style={{ marginBottom: "10px", display: "flex", gap: "8px", alignItems: "flex-start" }}>
                <span style={{ color: "#6b7280", fontSize: "13px", minWidth: "56px" }}>Date</span>
                <span style={{ fontSize: "14px", color: "#111827", fontWeight: 500 }}>{formatDateDisplay(event.start_date)}</span>
              </div>
            )}
            {event?.venue && (
              <div style={{ display: "flex", gap: "8px", alignItems: "flex-start" }}>
                <span style={{ color: "#6b7280", fontSize: "13px", minWidth: "56px" }}>Venue</span>
                <span style={{ fontSize: "14px", color: "#111827", fontWeight: 500 }}>{event.venue}</span>
              </div>
            )}
          </div>

          {/* Attendee details */}
          <div style={{ padding: "20px 24px", borderBottom: "1px solid #e5e7eb" }}>
            <div style={{ marginBottom: "10px", display: "flex", gap: "8px", alignItems: "center" }}>
              <span style={{ color: "#6b7280", fontSize: "13px", minWidth: "56px" }}>Name</span>
              <span style={{ fontSize: "15px", color: "#111827", fontWeight: 600 }}>{registration.attendee_name}</span>
            </div>
            <div style={{ marginBottom: "10px", display: "flex", gap: "8px", alignItems: "center" }}>
              <span style={{ color: "#6b7280", fontSize: "13px", minWidth: "56px" }}>Ticket</span>
              <span style={{ fontSize: "14px", color: "#111827" }}>{ticketTypeName}</span>
            </div>
            <div style={{ display: "flex", gap: "8px", alignItems: "center", flexWrap: "wrap" }}>
              <span style={{ color: "#6b7280", fontSize: "13px", minWidth: "56px" }}>Status</span>
              <span style={statusBadgeStyle(registration.status as RegistrationStatus)}>
                {registration.status}
              </span>
              <span style={paymentBadgeStyle(registration.payment_status as PaymentStatus)}>
                {registration.payment_status}
              </span>
            </div>
          </div>

          {/* QR code */}
          <div style={{ padding: "28px 24px", display: "flex", flexDirection: "column", alignItems: "center" }}>
            <p style={{ fontSize: "13px", color: "#6b7280", marginBottom: "16px", textAlign: "center" }}>
              Show this QR code at the venue for check-in
            </p>
            <img
              src={qrDataUrl}
              alt="Your QR code"
              style={{ width: "220px", height: "220px", borderRadius: "8px", border: "1px solid #e5e7eb" }}
            />
            <p style={{ fontSize: "11px", color: "#9ca3af", marginTop: "12px", fontFamily: "monospace" }}>
              {registration.qr_code}
            </p>
          </div>
        </div>

        <p style={{ textAlign: "center", fontSize: "12px", color: "#9ca3af", marginTop: "20px" }}>
          Powered by Gatepass
        </p>
      </div>
    </main>
  );
}
