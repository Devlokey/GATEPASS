import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";

// GET /api/events — list all events for authenticated organizer
export async function GET() {
  const supabase = createClient();

  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { data: events, error } = await supabase
    .from("events")
    .select("*, ticket_types(id), registrations(id, status)")
    .eq("organizer_id", user.id)
    .order("created_at", { ascending: false });

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  return NextResponse.json({ events });
}

// POST /api/events — create a new event
export async function POST(request: NextRequest) {
  const supabase = createClient();

  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const body = await request.json();
  const {
    title,
    slug,
    description,
    venue,
    start_date,
    status,
    capacity,
    is_invite_only,
  } = body;

  if (!title || !slug) {
    return NextResponse.json(
      { error: "title and slug are required" },
      { status: 400 }
    );
  }

  const { data: event, error } = await supabase
    .from("events")
    .insert({
      title,
      slug,
      description: description ?? null,
      venue: venue ?? null,
      start_date: start_date ?? null,
      status: status ?? "draft",
      capacity: capacity ?? null,
      is_invite_only: is_invite_only ?? false,
      organizer_id: user.id,
    })
    .select()
    .single();

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  return NextResponse.json({ event }, { status: 201 });
}

// PATCH /api/events — update an event
export async function PATCH(request: NextRequest) {
  const supabase = createClient();

  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const body = await request.json();
  const { id, ...fields } = body;

  if (!id) {
    return NextResponse.json({ error: "id is required" }, { status: 400 });
  }

  // Verify ownership
  const { data: existing, error: fetchError } = await supabase
    .from("events")
    .select("id, organizer_id")
    .eq("id", id)
    .single();

  if (fetchError || !existing) {
    return NextResponse.json({ error: "Event not found" }, { status: 404 });
  }

  if (existing.organizer_id !== user.id) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  const { data: event, error } = await supabase
    .from("events")
    .update({ ...fields, updated_at: new Date().toISOString() })
    .eq("id", id)
    .select()
    .single();

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  return NextResponse.json({ event });
}

// DELETE /api/events?id=<event_id> — delete an event
export async function DELETE(request: NextRequest) {
  const supabase = createClient();

  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { searchParams } = new URL(request.url);
  const id = searchParams.get("id");

  if (!id) {
    return NextResponse.json({ error: "id query param is required" }, { status: 400 });
  }

  // Verify ownership
  const { data: existing, error: fetchError } = await supabase
    .from("events")
    .select("id, organizer_id")
    .eq("id", id)
    .single();

  if (fetchError || !existing) {
    return NextResponse.json({ error: "Event not found" }, { status: 404 });
  }

  if (existing.organizer_id !== user.id) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  const { error } = await supabase.from("events").delete().eq("id", id);

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  return NextResponse.json({ success: true });
}
