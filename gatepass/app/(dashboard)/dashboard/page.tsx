import { redirect } from "next/navigation";
import Image from "next/image";
import Link from "next/link";
import { createClient } from "@/lib/supabase/server";
import { formatDate } from "@/lib/utils";
import type { Event, Registration } from "@/types";

type EventRow = Event & { ticket_types: { id: string }[]; registrations: Pick<Registration, "status">[] };

export const metadata = { title: "Dashboard — Gatepass" };

export default async function DashboardPage() {
  const supabase = createClient();

  const { data: { user } } = await supabase.auth.getUser();
  if (!user) redirect("/login");

  const { data: profile } = await supabase
    .from("profiles")
    .select("full_name")
    .eq("id", user.id)
    .single();

  const { data: events } = await supabase
    .from("events")
    .select("*, ticket_types(id), registrations(id, status)")
    .eq("organizer_id", user.id)
    .order("created_at", { ascending: false });

  const displayName = profile?.full_name ?? user.email?.split("@")[0] ?? "Organizer";

  return (
    <div className="dashboard-page">
      <header className="dashboard-header">
        <div className="dashboard-header-inner">
          <div>
            <h1 className="dashboard-title">Good morning, {displayName} 👋</h1>
            <p className="dashboard-subtitle">Manage your events and track registrations</p>
          </div>
          <Link href="/events/create" className="btn-primary">
            + New Event
          </Link>
        </div>
      </header>

      <main className="dashboard-main">
        {/* Stats row */}
        <div className="stats-grid">
          <StatCard label="Total Events" value={events?.length ?? 0} icon="🗓" />
          <StatCard
            label="Published"
            value={events?.filter((e: EventRow) => e.status === "published").length ?? 0}
            icon="🟢"
          />
          <StatCard
            label="Total Registrations"
            value={
              events?.reduce(
                (sum: number, e: EventRow) =>
                  sum + (e.registrations?.filter((r) => r.status !== "cancelled").length ?? 0),
                0
              ) ?? 0
            }
            icon="🎟"
          />
        </div>

        {/* Events list */}
        <section>
          <h2 className="section-title">Your Events</h2>
          {!events || events.length === 0 ? (
            <div className="empty-state">
              <div className="empty-state-icon">🎪</div>
              <p>No events yet. Create your first one!</p>
              <Link href="/events/create" className="btn-primary">
                Create Event
              </Link>
            </div>
          ) : (
            <div className="events-grid">
              {events.map((event: EventRow) => (
                <EventCard key={event.id} event={event} />
              ))}
            </div>
          )}
        </section>
      </main>
    </div>
  );
}

function StatCard({ label, value, icon }: { label: string; value: number; icon: string }) {
  return (
    <div className="stat-card">
      <div className="stat-icon">{icon}</div>
      <div className="stat-value">{value.toLocaleString("en-IN")}</div>
      <div className="stat-label">{label}</div>
    </div>
  );
}

function EventCard({ event }: { event: EventRow }) {
  const confirmed = event.registrations?.filter((r) =>
    ["confirmed", "pending"].includes(r.status)
  ).length ?? 0;
  const capacity = event.capacity;

  const statusColors: Record<string, string> = {
    draft: "#6b7280",
    published: "#22c55e",
    completed: "#a855f7",
  };

  return (
    <div className="event-card">
      {event.banner_url && (
        <div className="event-card-banner">
          <Image src={event.banner_url} alt={event.title} width={400} height={160} style={{ width: "100%", height: "auto", objectFit: "cover" }} />
        </div>
      )}
      <div className="event-card-body">
        <div className="event-card-header">
          <span className="event-status-dot" style={{ background: statusColors[event.status] }} />
          <span className="event-status-label">{event.status}</span>
        </div>
        <h3 className="event-card-title">{event.title}</h3>
        <p className="event-card-date">{formatDate(event.start_date)}</p>
        {capacity && (
          <div className="capacity-bar-wrap">
            <div className="capacity-bar">
              <div
                className="capacity-bar-fill"
                style={{ width: `${Math.min(100, (confirmed / capacity) * 100)}%` }}
              />
            </div>
            <span className="capacity-label">
              {confirmed} / {capacity} registered
            </span>
          </div>
        )}
        {!capacity && (
          <p className="event-card-registrations">{confirmed} registered</p>
        )}
        <div className="event-card-actions">
          <Link href={`/events/${event.slug}`} className="btn-ghost" target="_blank">
            View ↗
          </Link>
          <Link href={`/events/${event.slug}/manage`} className="btn-secondary">
            Manage →
          </Link>
        </div>
      </div>
    </div>
  );
}
