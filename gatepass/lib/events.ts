import type { SupabaseClient } from "@supabase/supabase-js";
import type { Event, EventWithDetails } from "@/types";

/**
 * Get all events for an organizer, with registration and ticket counts.
 */
export async function getOrganizerEvents(
  supabase: SupabaseClient,
  organizerId: string
): Promise<EventWithDetails[]> {
  const { data, error } = await supabase
    .from("events")
    .select("*, ticket_types(*), form_fields(*), registrations(id, status)")
    .eq("organizer_id", organizerId)
    .order("created_at", { ascending: false });

  if (error || !data) return [];

  return data.map((row) => {
    const registrations = row.registrations ?? [];
    const registration_count = registrations.filter((r: { status: string }) =>
      ["confirmed", "pending"].includes(r.status)
    ).length;

    return {
      ...row,
      registration_count,
    } as EventWithDetails;
  });
}

/**
 * Get a single event by slug (public, no auth required).
 */
export async function getEventBySlug(
  supabase: SupabaseClient,
  slug: string
): Promise<EventWithDetails | null> {
  const { data, error } = await supabase
    .from("events")
    .select("*, ticket_types(*), form_fields(*)")
    .eq("slug", slug)
    .single();

  if (error || !data) return null;

  return data as EventWithDetails;
}

/**
 * Get a single event by id.
 */
export async function getEventById(
  supabase: SupabaseClient,
  id: string
): Promise<Event | null> {
  const { data, error } = await supabase
    .from("events")
    .select("*")
    .eq("id", id)
    .single();

  if (error || !data) return null;

  return data as Event;
}

/**
 * Check if a slug is already taken. Optionally exclude a specific event id
 * (useful when editing an existing event that already owns the slug).
 */
export async function isSlugTaken(
  supabase: SupabaseClient,
  slug: string,
  excludeId?: string
): Promise<boolean> {
  let query = supabase
    .from("events")
    .select("id")
    .eq("slug", slug);

  if (excludeId) {
    query = query.neq("id", excludeId);
  }

  const { data, error } = await query.maybeSingle();

  if (error) return false;
  return data !== null;
}
