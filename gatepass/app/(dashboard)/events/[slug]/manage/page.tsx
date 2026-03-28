import { redirect, notFound } from "next/navigation";
import Link from "next/link";
import { createClient } from "@/lib/supabase/server";
import { formatDate, formatDateTime, formatPrice } from "@/lib/utils";
import type { TicketType, RegistrationStatus, PaymentStatus } from "@/types";

type RegRow = {
  id: string;
  attendee_name: string;
  attendee_email: string;
  ticket_type_id: string | null;
  status: RegistrationStatus;
  payment_status: PaymentStatus;
  created_at: string;
  ticket_types: { name: string } | null;
  check_ins: { checked_in_at: string }[];
};

export async function generateMetadata({ params }: { params: { slug: string } }) {
  return { title: `Manage ${params.slug} — Gatepass` };
}

export default async function ManageEventPage({ params }: { params: { slug: string } }) {
  const supabase = createClient();

  const { data: { user } } = await supabase.auth.getUser();
  if (!user) redirect("/login");

  const { data: event } = await supabase
    .from("events")
    .select("*, ticket_types(*), form_fields(*)")
    .eq("slug", params.slug)
    .eq("organizer_id", user.id)
    .single();

  if (!event) notFound();

  const { data: registrations } = await supabase
    .from("registrations")
    .select("*, ticket_types(name), check_ins(checked_in_at)")
    .eq("event_id", event.id)
    .order("created_at", { ascending: false });

  const confirmed = registrations?.filter((r) => r.status === "confirmed").length ?? 0;
  const waitlisted = registrations?.filter((r) => r.status === "waitlisted").length ?? 0;
  const checkedIn = registrations?.filter((r: RegRow) => r.check_ins?.length > 0).length ?? 0;
  const revenue = registrations
    ?.filter((r) => r.payment_status === "paid")
    .reduce((sum, r) => {
      const ticket = event.ticket_types?.find((t: TicketType) => t.id === r.ticket_type_id);
      return sum + (ticket?.price ?? 0);
    }, 0) ?? 0;

  const csvUrl = `/api/analytics?event_id=${event.id}&format=csv`;

  return (
    <div className="manage-page">
      <header className="manage-header">
        <div className="manage-header-inner">
          <div>
            <Link href="/dashboard" className="back-link">← Dashboard</Link>
            <h1 className="manage-title">{event.title}</h1>
            <div className="manage-meta">
              <span className={`status-badge status-${event.status}`}>{event.status}</span>
              <span>{formatDate(event.start_date)}</span>
              {event.venue && <span>📍 {event.venue}</span>}
            </div>
          </div>
          <div className="manage-header-actions">
            <Link href={`/events/${event.slug}`} className="btn-ghost" target="_blank">
              Public Page ↗
            </Link>
            <Link href={`/events/${event.slug}/manage/checkin`} className="btn-primary">
              📷 Check-in Scanner
            </Link>
          </div>
        </div>
      </header>

      <main className="manage-main">
        {/* Stats */}
        <div className="manage-stats">
          <div className="manage-stat"><span className="ms-value">{confirmed}</span><span className="ms-label">Confirmed</span></div>
          <div className="manage-stat"><span className="ms-value">{waitlisted}</span><span className="ms-label">Waitlisted</span></div>
          <div className="manage-stat"><span className="ms-value">{checkedIn}</span><span className="ms-label">Checked In</span></div>
          <div className="manage-stat"><span className="ms-value">{formatPrice(revenue)}</span><span className="ms-label">Revenue</span></div>
        </div>

        {/* Registrations table */}
        <section className="registrations-section">
          <div className="section-header">
            <h2 className="section-title">Registrations ({registrations?.length ?? 0})</h2>
            <a href={csvUrl} download className="btn-ghost">
              ⬇ Export CSV
            </a>
          </div>

          {!registrations || registrations.length === 0 ? (
            <div className="empty-state">
              <div className="empty-state-icon">🎟</div>
              <p>No registrations yet. Share your event page to get started.</p>
              <Link href={`/events/${event.slug}`} className="btn-primary" target="_blank">
                Share Event →
              </Link>
            </div>
          ) : (
            <div className="table-container">
              <table className="registrations-table">
                <thead>
                  <tr>
                    <th>Attendee</th>
                    <th>Ticket</th>
                    <th>Status</th>
                    <th>Payment</th>
                    <th>Check-in</th>
                    <th>Registered</th>
                  </tr>
                </thead>
                <tbody>
                  {registrations.map((reg: RegRow) => (
                    <tr key={reg.id}>
                      <td data-label="Attendee">
                        <div className="attendee-cell">
                          <span className="attendee-name">{reg.attendee_name}</span>
                          <span className="attendee-email">{reg.attendee_email}</span>
                        </div>
                      </td>
                      <td data-label="Ticket">{reg.ticket_types?.name ?? "—"}</td>
                      <td data-label="Status">
                        <span className={`status-badge status-${reg.status}`}>{reg.status}</span>
                      </td>
                      <td data-label="Payment">
                        <span className={`payment-badge payment-${reg.payment_status}`}>{reg.payment_status}</span>
                      </td>
                      <td data-label="Check-in">
                        {reg.check_ins?.length > 0
                          ? <span className="checkin-yes">✅ {formatDateTime(reg.check_ins[0].checked_in_at)}</span>
                          : <span className="checkin-no">—</span>
                        }
                      </td>
                      <td data-label="Registered" className="date-cell">{formatDateTime(reg.created_at)}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </section>
      </main>
    </div>
  );
}
