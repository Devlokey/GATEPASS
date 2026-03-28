import { redirect, notFound } from "next/navigation";
import Link from "next/link";
import { createClient } from "@/lib/supabase/server";
import QrScanner from "@/components/checkin/QrScanner";

export async function generateMetadata({ params }: { params: { slug: string } }) {
  return { title: `Check-in — ${params.slug} — Gatepass` };
}

export default async function CheckinPage({ params }: { params: { slug: string } }) {
  const supabase = createClient();

  const { data: { user } } = await supabase.auth.getUser();
  if (!user) redirect("/login");

  const { data: event } = await supabase
    .from("events")
    .select("id, title, slug, organizer_id")
    .eq("slug", params.slug)
    .eq("organizer_id", user.id)
    .single();

  if (!event) notFound();

  return (
    <div className="checkin-page">
      <header className="checkin-header">
        <Link href={`/events/${params.slug}/manage`} className="back-link">
          ← Back to Manage
        </Link>
        <h1 className="checkin-title">📷 Check-in Scanner</h1>
        <p className="checkin-subtitle">{event.title}</p>
      </header>

      <div className="checkin-body">
        <QrScanner eventId={event.id} />
      </div>
    </div>
  );
}
