import { notFound } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import RegisterForm from "@/components/registration/RegisterForm";
import { isRegistrationOpen } from "@/lib/utils";

export async function generateMetadata({ params }: { params: { slug: string } }) {
  const supabase = createClient();
  const { data: event } = await supabase
    .from("events")
    .select("title")
    .eq("slug", params.slug)
    .single();
  return { title: `Register — ${event?.title ?? params.slug} — Gatepass` };
}

export default async function RegisterPage({ params }: { params: { slug: string } }) {
  const supabase = createClient();

  const { data: event } = await supabase
    .from("events")
    .select("*, ticket_types(*), form_fields(*)")
    .eq("slug", params.slug)
    .eq("status", "published")
    .single();

  if (!event) notFound();

  const registrationOpen = isRegistrationOpen(
    event.registration_start,
    event.registration_end
  );

  if (!registrationOpen) {
    return (
      <div className="register-page">
        <div className="registration-closed">
          <div className="closed-icon">🔒</div>
          <h2>Registration is closed</h2>
          <p>Registration for <strong>{event.title}</strong> is not currently open.</p>
          <a href={`/events/${params.slug}`} className="btn-secondary">
            ← Back to Event
          </a>
        </div>
      </div>
    );
  }

  const activeTickets = event.ticket_types?.filter((t: { is_active: boolean }) => t.is_active) ?? [];

  if (activeTickets.length === 0) {
    return (
      <div className="register-page">
        <div className="registration-closed">
          <div className="closed-icon">🎟</div>
          <h2>No tickets available</h2>
          <p>There are no active ticket types for this event at the moment.</p>
          <a href={`/events/${params.slug}`} className="btn-secondary">← Back to Event</a>
        </div>
      </div>
    );
  }

  return (
    <div className="register-page">
      <div className="register-card">
        <div className="register-header">
          <h1 className="register-event-title">{event.title}</h1>
          <p className="register-event-meta">Register for this event</p>
        </div>
        <RegisterForm event={event} />
      </div>
    </div>
  );
}
