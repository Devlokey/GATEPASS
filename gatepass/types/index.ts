// ============================================================
// Gatepass — Shared TypeScript Type Definitions
// Aligned with supabase/migrations/001_initial_schema.sql
// ============================================================

export type EventStatus = "draft" | "published" | "completed";
export type RegistrationStatus = "pending" | "confirmed" | "waitlisted" | "cancelled";
export type PaymentStatus = "free" | "pending" | "paid" | "refunded";
export type FormFieldType = "text" | "email" | "phone" | "select" | "checkbox" | "textarea" | "number";

// ──────────────────────────────────────────────
// Profiles
// ──────────────────────────────────────────────
export interface Profile {
  id: string;
  full_name: string | null;
  avatar_url: string | null;
  created_at: string;
  updated_at: string;
}

// ──────────────────────────────────────────────
// Events
// ──────────────────────────────────────────────
export interface Event {
  id: string;
  slug: string;
  title: string;
  description: string | null;
  banner_url: string | null;
  logo_url: string | null;
  organizer_id: string;
  venue: string | null;
  start_date: string | null;
  end_date: string | null;
  registration_start: string | null;
  registration_end: string | null;
  status: EventStatus;
  capacity: number | null;
  is_invite_only: boolean;
  created_at: string;
  updated_at: string;
}

export interface EventWithDetails extends Event {
  ticket_types: TicketType[];
  form_fields: FormField[];
  profile?: Profile;
  registration_count?: number;
  checkin_count?: number;
}

// ──────────────────────────────────────────────
// Ticket Types
// ──────────────────────────────────────────────
export interface TicketType {
  id: string;
  event_id: string;
  name: string;
  description: string | null;
  price: number;         // in paise (₹1 = 100 paise). 0 = free
  capacity: number | null;
  is_active: boolean;
  created_at: string;
  updated_at: string;
}

// ──────────────────────────────────────────────
// Form Fields
// ──────────────────────────────────────────────
export interface FormField {
  id: string;
  event_id: string;
  label: string;
  field_type: FormFieldType;
  options: string[] | null;
  placeholder: string | null;
  is_required: boolean;
  order_index: number;
  created_at: string;
}

// ──────────────────────────────────────────────
// Registrations
// ──────────────────────────────────────────────
export interface Registration {
  id: string;
  event_id: string;
  ticket_type_id: string | null;
  attendee_name: string;
  attendee_email: string;
  attendee_phone: string | null;
  form_data: Record<string, unknown>;
  status: RegistrationStatus;
  payment_status: PaymentStatus;
  qr_code: string;
  razorpay_order_id: string | null;
  razorpay_payment_id: string | null;
  created_at: string;
  updated_at: string;
}

export interface RegistrationWithDetails extends Registration {
  ticket_type?: TicketType;
  check_in?: CheckIn;
}

// ──────────────────────────────────────────────
// Check-ins
// ──────────────────────────────────────────────
export interface CheckIn {
  id: string;
  registration_id: string;
  checked_in_at: string;
  checked_in_by: string | null;
}

// ──────────────────────────────────────────────
// Payments
// ──────────────────────────────────────────────
export interface Payment {
  id: string;
  registration_id: string;
  razorpay_order_id: string;
  razorpay_payment_id: string | null;
  razorpay_signature: string | null;
  amount: number;        // in paise
  currency: string;
  status: PaymentStatus;
  webhook_payload: Record<string, unknown> | null;
  created_at: string;
  updated_at: string;
}

// ──────────────────────────────────────────────
// API payloads
// ──────────────────────────────────────────────
export interface RegisterPayload {
  event_id: string;
  ticket_type_id: string;
  attendee_name: string;
  attendee_email: string;
  attendee_phone?: string;
  form_data: Record<string, unknown>;
}

export interface CheckinPayload {
  qr_code: string;
  event_id: string;
}

export interface CheckinResult {
  success: boolean;
  message: string;
  attendee_name?: string;
  ticket_type?: string;
  already_checked_in?: boolean;
}

// ──────────────────────────────────────────────
// Analytics
// ──────────────────────────────────────────────
export interface EventAnalytics {
  total_registrations: number;
  confirmed: number;
  waitlisted: number;
  cancelled: number;
  checked_in: number;
  revenue_paise: number;   // total paid in paise
  by_ticket_type: {
    ticket_type_id: string;
    name: string;
    count: number;
    revenue_paise: number;
  }[];
}
