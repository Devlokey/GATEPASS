import { redirect } from "next/navigation";
import Link from "next/link";
import { createClient } from "@/lib/supabase/server";
import { formatDate } from "@/lib/utils";
import type { Event, Registration } from "@/types";

export const metadata = { title: "My Events — Gatepass" };

type EventRow = Event & {
  ticket_types: { id: string }[];
  registrations: Pick<Registration, "id" | "status">[];
};

export default async function EventsPage() {
  const supabase = createClient();

  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) redirect("/login");

  const { data: events } = await supabase
    .from("events")
    .select("*, ticket_types(id), registrations(id, status)")
    .eq("organizer_id", user.id)
    .order("created_at", { ascending: false });

  const statusColors: Record<string, string> = {
    draft: "#6b7280",
    published: "#22c55e",
    completed: "#a855f7",
  };

  return (
    <div style={{ padding: "2rem", maxWidth: "1100px", margin: "0 auto" }}>
      <div
        style={{
          display: "flex",
          justifyContent: "space-between",
          alignItems: "center",
          marginBottom: "2rem",
        }}
      >
        <div>
          <h1 style={{ fontSize: "1.75rem", fontWeight: 700, margin: 0 }}>
            My Events
          </h1>
          <p style={{ color: "#6b7280", marginTop: "0.25rem" }}>
            Manage all your events in one place
          </p>
        </div>
        <Link
          href="/events/create"
          className="btn-primary"
          style={{
            padding: "0.6rem 1.2rem",
            background: "#6366f1",
            color: "#fff",
            borderRadius: "0.5rem",
            textDecoration: "none",
            fontWeight: 600,
            fontSize: "0.95rem",
          }}
        >
          + Create New Event
        </Link>
      </div>

      {!events || events.length === 0 ? (
        <div
          style={{
            textAlign: "center",
            padding: "4rem 2rem",
            background: "#f9fafb",
            borderRadius: "1rem",
            border: "1px dashed #d1d5db",
          }}
        >
          <div style={{ fontSize: "3rem", marginBottom: "1rem" }}>🎪</div>
          <p
            style={{
              color: "#6b7280",
              fontSize: "1.1rem",
              marginBottom: "1.5rem",
            }}
          >
            You haven&apos;t created any events yet.
          </p>
          <Link
            href="/events/create"
            style={{
              padding: "0.6rem 1.4rem",
              background: "#6366f1",
              color: "#fff",
              borderRadius: "0.5rem",
              textDecoration: "none",
              fontWeight: 600,
            }}
          >
            Create Your First Event
          </Link>
        </div>
      ) : (
        <div
          style={{
            display: "grid",
            gridTemplateColumns: "repeat(auto-fill, minmax(320px, 1fr))",
            gap: "1.5rem",
          }}
        >
          {(events as EventRow[]).map((event) => {
            const confirmed =
              event.registrations?.filter((r) =>
                ["confirmed", "pending"].includes(r.status)
              ).length ?? 0;
            const capacity = event.capacity;

            return (
              <div
                key={event.id}
                style={{
                  background: "#fff",
                  borderRadius: "0.75rem",
                  border: "1px solid #e5e7eb",
                  overflow: "hidden",
                  boxShadow: "0 1px 3px rgba(0,0,0,0.06)",
                }}
              >
                <div style={{ padding: "1.25rem 1.5rem" }}>
                  <div
                    style={{
                      display: "flex",
                      alignItems: "center",
                      gap: "0.5rem",
                      marginBottom: "0.5rem",
                    }}
                  >
                    <span
                      style={{
                        width: "8px",
                        height: "8px",
                        borderRadius: "50%",
                        background: statusColors[event.status] ?? "#6b7280",
                        display: "inline-block",
                      }}
                    />
                    <span
                      style={{
                        fontSize: "0.75rem",
                        textTransform: "capitalize",
                        color: statusColors[event.status] ?? "#6b7280",
                        fontWeight: 600,
                      }}
                    >
                      {event.status}
                    </span>
                  </div>

                  <h3
                    style={{
                      fontSize: "1.1rem",
                      fontWeight: 700,
                      margin: "0 0 0.25rem",
                      lineHeight: 1.3,
                    }}
                  >
                    {event.title}
                  </h3>

                  {event.start_date && (
                    <p
                      style={{
                        color: "#6b7280",
                        fontSize: "0.875rem",
                        margin: "0 0 0.75rem",
                      }}
                    >
                      {formatDate(event.start_date)}
                    </p>
                  )}

                  {capacity ? (
                    <div style={{ marginBottom: "0.75rem" }}>
                      <div
                        style={{
                          background: "#f3f4f6",
                          borderRadius: "9999px",
                          height: "6px",
                          overflow: "hidden",
                          marginBottom: "0.25rem",
                        }}
                      >
                        <div
                          style={{
                            width: `${Math.min(100, (confirmed / capacity) * 100)}%`,
                            height: "100%",
                            background: "#6366f1",
                            borderRadius: "9999px",
                          }}
                        />
                      </div>
                      <span style={{ fontSize: "0.8rem", color: "#6b7280" }}>
                        {confirmed} / {capacity} registered
                      </span>
                    </div>
                  ) : (
                    <p
                      style={{
                        fontSize: "0.8rem",
                        color: "#6b7280",
                        marginBottom: "0.75rem",
                      }}
                    >
                      {confirmed} registered
                    </p>
                  )}

                  <div style={{ display: "flex", gap: "0.75rem" }}>
                    <Link
                      href={`/events/${event.slug}`}
                      target="_blank"
                      style={{
                        flex: 1,
                        textAlign: "center",
                        padding: "0.45rem 0",
                        border: "1px solid #d1d5db",
                        borderRadius: "0.4rem",
                        fontSize: "0.875rem",
                        color: "#374151",
                        textDecoration: "none",
                        fontWeight: 500,
                      }}
                    >
                      View ↗
                    </Link>
                    <Link
                      href={`/events/${event.slug}/manage`}
                      style={{
                        flex: 1,
                        textAlign: "center",
                        padding: "0.45rem 0",
                        background: "#6366f1",
                        borderRadius: "0.4rem",
                        fontSize: "0.875rem",
                        color: "#fff",
                        textDecoration: "none",
                        fontWeight: 500,
                      }}
                    >
                      Manage →
                    </Link>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
