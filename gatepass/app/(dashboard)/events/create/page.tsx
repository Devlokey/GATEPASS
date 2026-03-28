'use client';

import { useState, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { createClient } from '@/lib/supabase/client';
import { rupeesToPaise } from '@/lib/utils';
import './create.css';

/* ── Types ── */
type Step = 1 | 2 | 3 | 'success';
type Visibility = 'public' | 'draft' | 'invite-only';

interface TicketRow {
  id: number;
  name: string;
  price: string;
}

interface FormData {
  // Step 1
  eventName: string;
  description: string;
  date: string;
  time: string;
  location: string;
  bannerFileName: string;
  // Step 2
  tickets: TicketRow[];
  capacity: number;
  visibility: Visibility;
  registrationClose: string;
  // Step 3
  slug: string;
  organizerName: string;
  contactEmail: string;
  emailConfirmation: boolean;
  notifyRegistrations: boolean;
}

const initialForm: FormData = {
  eventName: '',
  description: '',
  date: '',
  time: '',
  location: '',
  bannerFileName: '',
  tickets: [{ id: 1, name: '', price: '' }],
  capacity: 500,
  visibility: 'draft',
  registrationClose: '',
  slug: '',
  organizerName: '',
  contactEmail: '',
  emailConfirmation: true,
  notifyRegistrations: true,
};

const STEP_META: Record<number, { title: string; sub: string }> = {
  1: { title: 'CREATE YOUR EVENT.', sub: "Let's get your event live in under 5 minutes" },
  2: { title: 'TICKETS & VISIBILITY.', sub: 'Set up ticket types and control who can register' },
  3: { title: 'PUBLISH DETAILS.', sub: 'Configure your event URL and notifications' },
};

let ticketIdCounter = 2;

/* ── Component ── */
export default function CreateEventPage() {
  const router = useRouter();
  const [step, setStep] = useState<Step>(1);
  const [form, setForm] = useState<FormData>(initialForm);
  const [errors, setErrors] = useState<Partial<Record<string, string>>>({});
  const [isLoading, setIsLoading] = useState(false);
  const [copied, setCopied] = useState(false);
  const [createdSlug, setCreatedSlug] = useState('');
  const [bannerFile, setBannerFile] = useState<File | null>(null);

  /* ── Helpers ── */
  const updateForm = useCallback(<K extends keyof FormData>(key: K, value: FormData[K]) => {
    setForm((prev) => ({ ...prev, [key]: value }));
    setErrors((prev) => ({ ...prev, [key]: undefined }));
  }, []);

  const slugify = (str: string) =>
    str
      .toLowerCase()
      .trim()
      .replace(/[^a-z0-9\s-]/g, '')
      .replace(/\s+/g, '-')
      .replace(/-+/g, '-');

  const eventUrl = `${typeof window !== 'undefined' ? window.location.origin : ''}/events/${createdSlug || form.slug || 'your-event-slug'}`;

  /* ── Ticket management ── */
  const addTicket = () => {
    setForm((prev) => ({
      ...prev,
      tickets: [...prev.tickets, { id: ticketIdCounter++, name: '', price: '' }],
    }));
  };

  const removeTicket = (id: number) => {
    setForm((prev) => ({
      ...prev,
      tickets: prev.tickets.filter((t) => t.id !== id),
    }));
  };

  const updateTicket = (id: number, field: 'name' | 'price', value: string) => {
    setForm((prev) => ({
      ...prev,
      tickets: prev.tickets.map((t) => (t.id === id ? { ...t, [field]: value } : t)),
    }));
    setErrors((prev) => ({ ...prev, tickets: undefined }));
  };

  /* ── Validation ── */
  const validateStep = (s: number): boolean => {
    const errs: Partial<Record<string, string>> = {};
    if (s === 1) {
      if (!form.eventName.trim()) errs.eventName = 'Event name is required';
      if (!form.date) errs.date = 'Date is required';
    }
    if (s === 2) {
      const hasValidTicket = form.tickets.some((t) => t.name.trim());
      if (!hasValidTicket) errs.tickets = 'Add at least one ticket type with a name';
    }
    setErrors(errs);
    return Object.keys(errs).length === 0;
  };

  /* ── Submit to Supabase ── */
  const handleCreateEvent = async () => {
    setIsLoading(true);
    setErrors({});

    try {
      const supabase = createClient();

      const { data: { user } } = await supabase.auth.getUser();
      if (!user) {
        setErrors({ submit: 'You must be logged in to create an event.' });
        setIsLoading(false);
        return;
      }

      // Upload banner if provided
      let bannerUrl: string | null = null;
      if (bannerFile) {
        const ext = bannerFile.name.split('.').pop();
        const path = `banners/${user.id}/${Date.now()}.${ext}`;
        const { error: uploadErr } = await supabase.storage
          .from('event-assets')
          .upload(path, bannerFile, { upsert: true });
        if (!uploadErr) {
          const { data: urlData } = supabase.storage.from('event-assets').getPublicUrl(path);
          bannerUrl = urlData.publicUrl;
        }
      }

      // Build start_date from date + time
      const startDate = form.date
        ? form.time
          ? `${form.date}T${form.time}:00`
          : `${form.date}T00:00:00`
        : null;

      // Insert event
      const { data: event, error: eventErr } = await supabase
        .from('events')
        .insert({
          slug: form.slug || slugify(form.eventName),
          title: form.eventName,
          description: form.description || null,
          banner_url: bannerUrl,
          organizer_id: user.id,
          venue: form.location || null,
          start_date: startDate,
          registration_end: form.registrationClose ? `${form.registrationClose}T23:59:59` : null,
          status: form.visibility === 'public' ? 'published' : 'draft',
          capacity: form.capacity,
          is_invite_only: form.visibility === 'invite-only',
        })
        .select('id, slug')
        .single();

      if (eventErr || !event) {
        const msg = eventErr?.message?.includes('unique')
          ? 'This event slug is already taken. Please choose a different name.'
          : eventErr?.message ?? 'Failed to create event.';
        setErrors({ submit: msg });
        setIsLoading(false);
        return;
      }

      // Insert ticket types
      const ticketRows = form.tickets
        .filter((t) => t.name.trim())
        .map((t) => ({
          event_id: event.id,
          name: t.name.trim(),
          price: t.price ? rupeesToPaise(Number(t.price)) : 0,
          is_active: true,
        }));

      if (ticketRows.length > 0) {
        const { error: ticketErr } = await supabase
          .from('ticket_types')
          .insert(ticketRows);
        if (ticketErr) {
          console.error('Ticket insert error (non-fatal):', ticketErr);
        }
      }

      setCreatedSlug(event.slug);
      setIsLoading(false);
      setStep('success');
    } catch (err) {
      console.error('Create event error:', err);
      setErrors({ submit: 'Something went wrong. Please try again.' });
      setIsLoading(false);
    }
  };

  /* ── Navigation ── */
  const handleNext = () => {
    if (step === 'success') return;
    const currentStep = step as number;
    if (!validateStep(currentStep)) return;

    if (currentStep === 3) {
      handleCreateEvent();
    } else {
      setStep((currentStep + 1) as Step);
    }
  };

  const handleBack = () => {
    if (step === 'success' || step === 1) return;
    setStep(((step as number) - 1) as Step);
    setErrors({});
  };

  /* ── Copy to clipboard ── */
  const handleCopy = () => {
    navigator.clipboard.writeText(eventUrl).catch(() => {});
    setCopied(true);
    setTimeout(() => setCopied(false), 2200);
  };

  /* ── Slider fill style ── */
  const sliderFill = `${((form.capacity - 50) / (5000 - 50)) * 100}%`;

  /* ── Step indicator helpers ── */
  const stepNum = step === 'success' ? 4 : (step as number);
  const isStepDone = (n: number) => stepNum > n;
  const isStepActive = (n: number) => stepNum === n;

  /* ── Render ── */
  return (
    <main className="create-page">
      {/* Background */}
      <div className="create-orbs" aria-hidden="true">
        <div className="create-orb create-orb-1" />
        <div className="create-orb create-orb-2" />
        <div className="create-orb create-orb-3" />
      </div>
      <div className="create-grain" aria-hidden="true" />

      {/* Top nav */}
      <nav className="create-nav" aria-label="Site navigation">
        <Link href="/" className="create-logo">
          GATE<span>PASS</span>
        </Link>
        <Link href="/dashboard" className="create-nav-link">
          Dashboard
        </Link>
      </nav>

      {/* Wizard card */}
      <div className="ob-card" role="main">
        {/* ── Card header ── */}
        {step !== 'success' && (
          <div className="ob-head">
            {/* Step indicator */}
            <div className="ob-steps" role="list" aria-label="Progress">
              {/* Step 1 */}
              <div
                className={`os${isStepDone(1) ? ' done' : ''}${isStepActive(1) ? ' active' : ''}`}
                role="listitem"
                aria-current={isStepActive(1) ? 'step' : undefined}
              >
                <div className="os-n" aria-hidden="true">
                  {isStepDone(1) ? '✓' : '1'}
                </div>
                <span className="os-label">Event info</span>
              </div>
              <div className={`os-line${isStepDone(1) ? ' done' : ''}`} aria-hidden="true" />

              {/* Step 2 */}
              <div
                className={`os${isStepDone(2) ? ' done' : ''}${isStepActive(2) ? ' active' : ''}`}
                role="listitem"
                aria-current={isStepActive(2) ? 'step' : undefined}
              >
                <div className="os-n" aria-hidden="true">
                  {isStepDone(2) ? '✓' : '2'}
                </div>
                <span className="os-label">Tickets</span>
              </div>
              <div className={`os-line${isStepDone(2) ? ' done' : ''}`} aria-hidden="true" />

              {/* Step 3 */}
              <div
                className={`os${isStepDone(3) ? ' done' : ''}${isStepActive(3) ? ' active' : ''}`}
                role="listitem"
                aria-current={isStepActive(3) ? 'step' : undefined}
              >
                <div className="os-n" aria-hidden="true">
                  {isStepDone(3) ? '✓' : '3'}
                </div>
                <span className="os-label">Publish</span>
              </div>
            </div>

            <div className="ob-title">
              {STEP_META[step as number]?.title}
            </div>
            <div className="ob-sub">
              {STEP_META[step as number]?.sub}
            </div>
          </div>
        )}

        {/* ── Card body ── */}
        <div className="ob-body">

          {/* ══ STEP 1: EVENT INFO ══ */}
          <div className={`step-panel${step === 1 ? ' active' : ''}`} aria-hidden={step !== 1}>
            {/* Event name */}
            <div className="fgrp">
              <label htmlFor="ev-name" className="flbl">
                Event Name <span className="flbl-req" aria-label="required">*</span>
              </label>
              <input
                id="ev-name"
                className="fi"
                type="text"
                placeholder="e.g. Tathva '26 — NIT Calicut"
                autoComplete="off"
                value={form.eventName}
                onChange={(e) => {
                  updateForm('eventName', e.target.value);
                  // Auto-generate slug if not manually edited
                  if (!form.slug) {
                    updateForm('slug', slugify(e.target.value));
                  }
                }}
                aria-required="true"
                aria-describedby={errors.eventName ? 'ev-name-err' : undefined}
              />
              {errors.eventName && (
                <div id="ev-name-err" className="field-error" role="alert">
                  {errors.eventName}
                </div>
              )}
            </div>

            {/* Description */}
            <div className="fgrp">
              <label htmlFor="ev-desc" className="flbl">Description</label>
              <textarea
                id="ev-desc"
                className="fi"
                rows={3}
                placeholder="What's the event about? What will attendees experience?"
                value={form.description}
                onChange={(e) => updateForm('description', e.target.value)}
              />
            </div>

            {/* Date + Time */}
            <div className="fi-row">
              <div className="fgrp">
                <label htmlFor="ev-date" className="flbl">
                  Date <span className="flbl-req" aria-label="required">*</span>
                </label>
                <input
                  id="ev-date"
                  className="fi"
                  type="date"
                  value={form.date}
                  onChange={(e) => updateForm('date', e.target.value)}
                  aria-required="true"
                  aria-describedby={errors.date ? 'ev-date-err' : undefined}
                />
                {errors.date && (
                  <div id="ev-date-err" className="field-error" role="alert">
                    {errors.date}
                  </div>
                )}
              </div>
              <div className="fgrp">
                <label htmlFor="ev-time" className="flbl">Time</label>
                <input
                  id="ev-time"
                  className="fi"
                  type="time"
                  value={form.time}
                  onChange={(e) => updateForm('time', e.target.value)}
                />
              </div>
            </div>

            {/* Location */}
            <div className="fgrp">
              <label htmlFor="ev-location" className="flbl">Location</label>
              <input
                id="ev-location"
                className="fi"
                type="text"
                placeholder="e.g. NIT Calicut Campus, Kozhikode, Kerala"
                value={form.location}
                onChange={(e) => updateForm('location', e.target.value)}
              />
            </div>

            {/* Banner upload */}
            <div className="fgrp">
              <label className="flbl" id="banner-label">Event Banner</label>
              <label
                className={`upload-zone${form.bannerFileName ? ' has-file' : ''}`}
                aria-labelledby="banner-label"
              >
                <input
                  type="file"
                  accept="image/*"
                  aria-label="Upload event banner image"
                  onChange={(e) => {
                    const file = e.target.files?.[0];
                    if (file) {
                      updateForm('bannerFileName', file.name);
                      setBannerFile(file);
                    }
                  }}
                />
                {form.bannerFileName ? (
                  <>
                    <div className="uz-ico" aria-hidden="true">🖼</div>
                    <div className="uz-filename">{form.bannerFileName}</div>
                    <div className="uz-sub">Click to change image</div>
                  </>
                ) : (
                  <>
                    <div className="uz-ico" aria-hidden="true">🖼</div>
                    <div className="uz-title">Upload banner image</div>
                    <div className="uz-sub">PNG, JPG or WEBP · Recommended 1600×900</div>
                  </>
                )}
              </label>
            </div>

            {/* Nav */}
            <div className="ob-nav">
              <div />
              <button className="btn-next" onClick={handleNext} type="button">
                Next: Tickets →
              </button>
            </div>
          </div>

          {/* ══ STEP 2: TICKETS & VISIBILITY ══ */}
          <div className={`step-panel${step === 2 ? ' active' : ''}`} aria-hidden={step !== 2}>
            {/* Ticket types */}
            <div className="fgrp">
              <label className="flbl" id="tickets-label">
                Ticket Types
              </label>
              <div className="tk-add" role="list" aria-labelledby="tickets-label">
                {form.tickets.map((ticket) => (
                  <div className="tk-row" key={ticket.id} role="listitem">
                    <input
                      className="tk-name-fi"
                      type="text"
                      placeholder="General Admission"
                      value={ticket.name}
                      onChange={(e) => updateTicket(ticket.id, 'name', e.target.value)}
                      aria-label="Ticket name"
                    />
                    <div className="tk-price-wrap">
                      <span className="tk-price-prefix">₹</span>
                      <input
                        className="tk-price-fi"
                        type="text"
                        inputMode="numeric"
                        placeholder="Free"
                        value={ticket.price}
                        onChange={(e) =>
                          updateTicket(ticket.id, 'price', e.target.value.replace(/[^0-9]/g, ''))
                        }
                        aria-label="Ticket price in rupees (leave blank for free)"
                      />
                    </div>
                    <button
                      className="tk-del"
                      type="button"
                      onClick={() => removeTicket(ticket.id)}
                      aria-label="Remove ticket type"
                      disabled={form.tickets.length === 1}
                    >
                      ✕
                    </button>
                  </div>
                ))}
              </div>
              {errors.tickets && (
                <div className="field-error" role="alert">
                  {errors.tickets}
                </div>
              )}
              <button className="add-tk-btn" type="button" onClick={addTicket}>
                + Add ticket type
              </button>
            </div>

            {/* Capacity slider */}
            <div className="fgrp">
              <label htmlFor="cap-slider" className="flbl">Total Capacity</label>
              <div className="cap-wrap">
                <div className="cap-top">
                  <div className="cap-value" aria-live="polite" aria-atomic="true">
                    {form.capacity.toLocaleString('en-IN')}
                  </div>
                  <div className="cap-limit">max 5,000</div>
                </div>
                <input
                  id="cap-slider"
                  className="cap-slider"
                  type="range"
                  min={50}
                  max={5000}
                  step={50}
                  value={form.capacity}
                  onChange={(e) => updateForm('capacity', Number(e.target.value))}
                  aria-valuemin={50}
                  aria-valuemax={5000}
                  aria-valuenow={form.capacity}
                  style={{
                    background: `linear-gradient(to right, var(--o) ${sliderFill}, var(--br) ${sliderFill})`,
                  }}
                />
                <div className="cap-ticks" aria-hidden="true">
                  <span>50</span>
                  <span>1,250</span>
                  <span>2,500</span>
                  <span>3,750</span>
                  <span>5,000</span>
                </div>
              </div>
            </div>

            {/* Event visibility */}
            <div className="fgrp">
              <label className="flbl" id="vis-label">Event Visibility</label>
              <div
                className="vis-row"
                role="group"
                aria-labelledby="vis-label"
              >
                {(
                  [
                    { value: 'public', label: '🌐 Public' },
                    { value: 'draft', label: '📝 Draft' },
                    { value: 'invite-only', label: '🔒 Invite only' },
                  ] as { value: Visibility; label: string }[]
                ).map(({ value, label }) => (
                  <button
                    key={value}
                    className={`vis-btn${form.visibility === value ? ' active' : ''}`}
                    type="button"
                    onClick={() => updateForm('visibility', value)}
                    aria-pressed={form.visibility === value}
                  >
                    {label}
                  </button>
                ))}
              </div>
            </div>

            {/* Registration close date */}
            <div className="fgrp">
              <label htmlFor="reg-close" className="flbl">Registration Closes</label>
              <input
                id="reg-close"
                className="fi"
                type="date"
                value={form.registrationClose}
                onChange={(e) => updateForm('registrationClose', e.target.value)}
              />
            </div>

            {/* Nav */}
            <div className="ob-nav">
              <button className="btn-back" type="button" onClick={handleBack}>
                ← Back
              </button>
              <button className="btn-next" type="button" onClick={handleNext}>
                Next: Publish →
              </button>
            </div>
          </div>

          {/* ══ STEP 3: PUBLISH ══ */}
          <div className={`step-panel${step === 3 ? ' active' : ''}`} aria-hidden={step !== 3}>
            {/* Slug */}
            <div className="fgrp">
              <label htmlFor="ev-slug" className="flbl">Your Event URL</label>
              <div className="slug-wrap">
                <span className="slug-prefix" aria-hidden="true">gatepass.app/e/</span>
                <input
                  id="ev-slug"
                  className="fi fi-slug"
                  type="text"
                  placeholder="tathva-26-nit-calicut"
                  value={form.slug}
                  onChange={(e) => updateForm('slug', slugify(e.target.value))}
                  aria-label="Event URL slug (after gatepass.app/e/)"
                />
              </div>
              <div className="slug-preview" aria-live="polite">
                gatepass.app/e/<span>{form.slug || 'your-event-slug'}</span>
              </div>
            </div>

            {/* Organizer name */}
            <div className="fgrp">
              <label htmlFor="org-name" className="flbl">Organizer Name</label>
              <input
                id="org-name"
                className="fi"
                type="text"
                placeholder="e.g. NIT Calicut Student Council"
                value={form.organizerName}
                onChange={(e) => updateForm('organizerName', e.target.value)}
              />
            </div>

            {/* Contact email */}
            <div className="fgrp">
              <label htmlFor="contact-email" className="flbl">Contact Email</label>
              <input
                id="contact-email"
                className="fi"
                type="email"
                placeholder="contact@tathva.org"
                value={form.contactEmail}
                onChange={(e) => updateForm('contactEmail', e.target.value)}
                autoComplete="email"
              />
            </div>

            {/* Notification checkboxes */}
            <div className="fgrp">
              <label className="flbl" id="notif-label" style={{ marginBottom: '10px' }}>
                Notifications
              </label>
              <div className="check-list" role="group" aria-labelledby="notif-label">
                <label className="check-item">
                  <input
                    type="checkbox"
                    checked={form.emailConfirmation}
                    onChange={(e) => updateForm('emailConfirmation', e.target.checked)}
                  />
                  Email confirmation to attendees on registration
                </label>
                <label className="check-item">
                  <input
                    type="checkbox"
                    checked={form.notifyRegistrations}
                    onChange={(e) => updateForm('notifyRegistrations', e.target.checked)}
                  />
                  Notify me of new registrations
                </label>
              </div>
            </div>

            {/* Submit error */}
            {errors.submit && (
              <div className="field-error" role="alert" style={{ marginBottom: '12px' }}>
                {errors.submit}
              </div>
            )}

            {/* Nav */}
            <div className="ob-nav">
              <button className="btn-back" type="button" onClick={handleBack}>
                ← Back
              </button>
              <button
                className={`btn-next btn-create${isLoading ? ' btn-loading' : ''}`}
                type="button"
                onClick={handleNext}
                disabled={isLoading}
                aria-busy={isLoading}
              >
                {isLoading ? (
                  <>
                    <span className="btn-spinner" aria-hidden="true" />
                    Creating…
                  </>
                ) : (
                  '🚀 Create Event'
                )}
              </button>
            </div>
          </div>

          {/* ══ SUCCESS SCREEN ══ */}
          <div className={`step-panel${step === 'success' ? ' active' : ''}`} aria-hidden={step !== 'success'}>
            <div className="succ-wrap" role="region" aria-label="Event created successfully">
              <div className="succ-ring" aria-hidden="true">✓</div>

              <div className="succ-title">EVENT LIVE!</div>

              <p className="succ-sub">
                Your event is created and ready for registrations. Share the link below with
                your attendees.
              </p>

              <div className="succ-url-wrap">
                <div className="succ-url" aria-label={`Event URL: ${eventUrl}`}>
                  {eventUrl}
                </div>
              </div>

              <div
                className={`copy-feedback${copied ? ' show' : ''}`}
                role="status"
                aria-live="polite"
              >
                {copied ? '✓ COPIED!' : ''}
              </div>

              <div className="succ-btns">
                <button
                  className="sbtn sbtn-primary"
                  type="button"
                  onClick={handleCopy}
                  aria-label="Copy event link to clipboard"
                >
                  📋 Copy event link
                </button>
                <Link href={createdSlug ? `/events/${createdSlug}/manage` : '/dashboard'} className="sbtn sbtn-ghost">
                  {createdSlug ? 'Manage Event →' : 'Go to Dashboard →'}
                </Link>
              </div>
            </div>
          </div>

        </div>
      </div>
    </main>
  );
}
