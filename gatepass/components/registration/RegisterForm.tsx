"use client";

import Image from "next/image";
import { useState } from "react";
import { useRouter } from "next/navigation";
import type { Event, TicketType, FormField } from "@/types";
import { formatPrice } from "@/lib/utils";

interface RegisterFormProps {
  event: Event & { ticket_types: TicketType[]; form_fields: FormField[] };
}

type Step = "select-ticket" | "fill-form" | "payment" | "success";

export default function RegisterForm({ event }: RegisterFormProps) {
  const router = useRouter();
  const [step, setStep] = useState<Step>("select-ticket");
  const [selectedTicket, setSelectedTicket] = useState<TicketType | null>(null);
  const [formData, setFormData] = useState<Record<string, unknown>>({});
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [phone, setPhone] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [qrCode, setQrCode] = useState("");
  const [isWaitlisted, setIsWaitlisted] = useState(false);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!selectedTicket) return;
    setLoading(true);
    setError("");

    try {
      const res = await fetch("/api/register", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          event_id: event.id,
          ticket_type_id: selectedTicket.id,
          attendee_name: name,
          attendee_email: email,
          attendee_phone: phone || undefined,
          form_data: formData,
        }),
      });

      const data = await res.json();

      if (!res.ok) {
        setError(data.error ?? "Registration failed. Please try again.");
        setLoading(false);
        return;
      }

      setIsWaitlisted(data.status === "waitlisted");

      if (data.payment_required) {
        // Launch Razorpay checkout
        await launchRazorpay({
          orderId: data.razorpay_order_id,
          keyId: data.razorpay_key_id,
          amount: data.amount,
          registrationId: data.registration_id,
        });
      } else {
        setQrCode(data.qr_code ?? "");
        setStep("success");
      }
    } catch {
      setError("Network error. Check your connection and try again.");
    } finally {
      setLoading(false);
    }
  }

  async function launchRazorpay(params: {
    orderId: string;
    keyId: string;
    amount: number;
    registrationId: string;
  }) {
    return new Promise<void>((resolve) => {
      const options = {
        key: params.keyId,
        amount: params.amount,
        currency: "INR",
        name: event.title,
        description: selectedTicket?.name,
        order_id: params.orderId,
        handler: () => {
          setQrCode("");
          setStep("success");
          resolve();
        },
        prefill: { name, email, contact: phone },
        theme: { color: "#7c3aed" },
        modal: {
          ondismiss: () => {
            setError("Payment was cancelled.");
            resolve();
          },
        },
      };
      // @ts-expect-error — Razorpay loaded via <script> in layout
      const rzp = new window.Razorpay(options);
      rzp.open();
    });
  }

  const sortedFields = [...(event.form_fields ?? [])].sort(
    (a, b) => a.order_index - b.order_index
  );

  // ── Step 1: Ticket Selection ──────────────────────────
  if (step === "select-ticket") {
    return (
      <div className="register-step">
        <h2 className="register-step-title">Select a Ticket</h2>
        <div className="ticket-options">
          {event.ticket_types
            .filter((t) => t.is_active)
            .map((ticket) => (
              <button
                key={ticket.id}
                className={`ticket-option ${selectedTicket?.id === ticket.id ? "selected" : ""}`}
                onClick={() => setSelectedTicket(ticket)}
                type="button"
              >
                <div className="ticket-option-name">{ticket.name}</div>
                {ticket.description && (
                  <div className="ticket-option-desc">{ticket.description}</div>
                )}
                <div className="ticket-option-price">{formatPrice(ticket.price)}</div>
              </button>
            ))}
        </div>
        <button
          className="btn-primary btn-full"
          disabled={!selectedTicket}
          onClick={() => setStep("fill-form")}
        >
          Continue →
        </button>
      </div>
    );
  }

  // ── Step 2: Fill Form ──────────────────────────────────
  if (step === "fill-form") {
    return (
      <form className="register-step" onSubmit={handleSubmit}>
        <h2 className="register-step-title">Your Details</h2>

        <div className="form-group">
          <label className="form-label">Full Name *</label>
          <input
            className="form-input"
            type="text"
            required
            placeholder="John Doe"
            value={name}
            onChange={(e) => setName(e.target.value)}
          />
        </div>

        <div className="form-group">
          <label className="form-label">Email *</label>
          <input
            className="form-input"
            type="email"
            required
            placeholder="john@college.edu"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
          />
        </div>

        <div className="form-group">
          <label className="form-label">Phone</label>
          <input
            className="form-input"
            type="tel"
            placeholder="+91 98765 43210"
            value={phone}
            onChange={(e) => setPhone(e.target.value)}
          />
        </div>

        {sortedFields.map((field) => (
          <div className="form-group" key={field.id}>
            <label className="form-label">
              {field.label} {field.is_required && "*"}
            </label>

            {field.field_type === "select" ? (
              <select
                className="form-input"
                required={field.is_required}
                value={(formData[field.id] as string) ?? ""}
                onChange={(e) => setFormData({ ...formData, [field.id]: e.target.value })}
              >
                <option value="">Select an option</option>
                {(field.options ?? []).map((opt) => (
                  <option key={opt} value={opt}>{opt}</option>
                ))}
              </select>
            ) : field.field_type === "checkbox" ? (
              <label className="form-checkbox-label">
                <input
                  type="checkbox"
                  required={field.is_required}
                  checked={(formData[field.id] as boolean) ?? false}
                  onChange={(e) => setFormData({ ...formData, [field.id]: e.target.checked })}
                />
                <span>{field.placeholder ?? "Yes"}</span>
              </label>
            ) : field.field_type === "textarea" ? (
              <textarea
                className="form-input form-textarea"
                required={field.is_required}
                placeholder={field.placeholder ?? ""}
                value={(formData[field.id] as string) ?? ""}
                onChange={(e) => setFormData({ ...formData, [field.id]: e.target.value })}
              />
            ) : (
              <input
                className="form-input"
                type={field.field_type === "email" ? "email" : field.field_type === "phone" ? "tel" : field.field_type === "number" ? "number" : "text"}
                required={field.is_required}
                placeholder={field.placeholder ?? ""}
                value={(formData[field.id] as string) ?? ""}
                onChange={(e) => setFormData({ ...formData, [field.id]: e.target.value })}
              />
            )}
          </div>
        ))}

        {error && <div className="form-error">{error}</div>}

        <div className="register-btn-row">
          <button type="button" className="btn-ghost" onClick={() => setStep("select-ticket")}>
            ← Back
          </button>
          <button type="submit" className="btn-primary" disabled={loading}>
            {loading
              ? "Registering…"
              : selectedTicket?.price === 0
              ? "Register Free"
              : `Pay ${formatPrice(selectedTicket?.price ?? 0)} →`}
          </button>
        </div>
      </form>
    );
  }

  // ── Step 3: Success ────────────────────────────────────
  return (
    <div className="register-success">
      <div className="success-icon">{isWaitlisted ? "⏳" : "🎉"}</div>
      <h2 className="success-title">
        {isWaitlisted ? "You're on the waitlist!" : "You're registered!"}
      </h2>
      <p className="success-subtitle">
        {isWaitlisted
          ? "We'll email you immediately when a spot opens up."
          : `A confirmation email with your QR code has been sent to ${email}.`}
      </p>
      {qrCode && !isWaitlisted && (
        <div className="success-qr">
          <p className="success-qr-label">Your check-in QR code</p>
          <Image
            src={`https://api.qrserver.com/v1/create-qr-code/?size=200x200&data=${qrCode}`}
            alt="QR Code"
            width={200}
            height={200}
            unoptimized
          />
          <p className="success-qr-code">{qrCode}</p>
        </div>
      )}
      <button className="btn-primary" onClick={() => router.push(`/events/${event.slug}`)}>
        ← Back to Event
      </button>
    </div>
  );
}
