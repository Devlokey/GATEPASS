import Image from 'next/image';
import { notFound } from 'next/navigation';
import type { TicketType } from '@/types';
import Link from 'next/link';
import { createClient } from '@/lib/supabase/server';
import { formatDate, formatPrice } from '@/lib/utils';
import EventNav from './EventNav';
import './event.css';

interface PageProps {
  params: { slug: string };
}

export async function generateMetadata({ params }: PageProps) {
  const supabase = createClient();
  const { data: event } = await supabase
    .from('events')
    .select('title, description')
    .eq('slug', params.slug)
    .single();
  return {
    title: event ? `${event.title} — Gatepass` : 'Event — Gatepass',
    description: event?.description ?? 'Register for this event on Gatepass.',
  };
}

export default async function EventPage({ params }: PageProps) {
  const { slug } = params;
  const supabase = createClient();

  // Fetch event with ticket types
  const { data: event } = await supabase
    .from('events')
    .select('*, ticket_types(*)')
    .eq('slug', slug)
    .single();

  if (!event) notFound();

  // Fetch organizer profile
  const { data: organizer } = await supabase
    .from('profiles')
    .select('full_name, avatar_url')
    .eq('id', event.organizer_id)
    .single();

  // Count registrations
  const { count: registeredCount } = await supabase
    .from('registrations')
    .select('id', { count: 'exact', head: true })
    .eq('event_id', event.id)
    .in('status', ['confirmed', 'pending']);

  const registered = registeredCount ?? 0;
  const capacity = event.capacity ?? 0;
  const spotsLeft = capacity > 0 ? Math.max(0, capacity - registered) : null;
  const filledPct = capacity > 0 ? Math.round((registered / capacity) * 100) : 0;

  const isOpen = event.status === 'published';
  const organizerName = organizer?.full_name ?? 'Organizer';
  const organizerInitials = organizerName.split(' ').map((w: string) => w[0]).join('').slice(0, 2).toUpperCase();

  const activeTickets = (event.ticket_types ?? []).filter((t: TicketType) => t.is_active);

  return (
    <>
      <EventNav slug={slug} title={event.title} />

      {/* ── HERO ─────────────────────────────────────────────────── */}
      <div className="ev-hero">
        <div className="ev-hero-banner">
          {event.banner_url ? (
            <Image src={event.banner_url} alt={event.title} className="ev-hero-banner-img" fill style={{ objectFit: "cover" }} />
          ) : (
            <>
              <div className="ev-orb ev-orb1" />
              <div className="ev-orb ev-orb2" />
            </>
          )}
        </div>
        <div className="ev-hero-overlay" />
        <div className="ev-hero-content">
          <div className="ev-hero-left">
            <div className="ev-status">
              <span className="ev-status-dot" />
              {isOpen ? 'Registration Open' : event.status === 'draft' ? 'Draft' : 'Completed'}
            </div>
            <h1 className="ev-title">
              {event.title}
              {event.description && (
                <>
                  <br />
                  <span className="ev-title-sub">{event.description.slice(0, 80)}</span>
                </>
              )}
            </h1>
            <div className="ev-meta">
              <div className="ev-meta-item">
                <span className="ev-meta-ico">📅</span>
                {event.start_date ? formatDate(event.start_date) : 'Date TBD'}
                {event.start_date && (
                  <>&nbsp;<strong>{new Date(event.start_date).toLocaleTimeString('en-IN', { hour: '2-digit', minute: '2-digit' })}</strong></>
                )}
              </div>
              {event.venue && (
                <div className="ev-meta-item">
                  <span className="ev-meta-ico">📍</span>
                  {event.venue}
                </div>
              )}
              <div className="ev-meta-item">
                <span className="ev-meta-ico">👤</span>
                <strong>{registered}</strong>&nbsp;registered
                {spotsLeft !== null && (
                  <>&nbsp;·&nbsp;<strong className="ev-spots">{spotsLeft} spots left</strong></>
                )}
              </div>
            </div>
          </div>
          <div className="ev-hero-right">
            {isOpen && (
              <Link href={`/events/${slug}/register`} className="ev-hero-cta">
                Register Now →
              </Link>
            )}
          </div>
        </div>
      </div>

      {/* ── CAPACITY STRIP ───────────────────────────────────────── */}
      {capacity > 0 && (
        <div className="ev-cap-strip">
          <span className="ev-cap-label">Capacity</span>
          <div className="ev-cap-bar">
            <div className="ev-cap-fill" style={{ width: `${filledPct}%` }} />
          </div>
          <span className="ev-cap-count">
            {registered} / {capacity} registered
          </span>
          {spotsLeft !== null && (
            <span className="ev-cap-left">{spotsLeft} left</span>
          )}
        </div>
      )}

      {/* ── MAIN TWO-COLUMN LAYOUT ───────────────────────────────── */}
      <div className="ev-main">

        {/* ── LEFT COLUMN ── */}
        <div className="ev-left">

          {/* ABOUT */}
          {event.description && (
            <section className="ev-sec">
              <div className="ev-sec-title">ABOUT</div>
              <div className="ev-desc">
                {event.description.split('\n').map((p: string, i: number) => (
                  <p key={i}>{p}</p>
                ))}
              </div>
            </section>
          )}

          {/* LOCATION */}
          {event.venue && (
            <section className="ev-sec">
              <div className="ev-sec-title">LOCATION</div>
              <div className="ev-loc-card">
                <div className="ev-loc-map">
                  <div className="ev-loc-grid" />
                  <div className="ev-loc-pin">📍</div>
                </div>
                <div className="ev-loc-body">
                  <div className="ev-loc-name">{event.venue}</div>
                  <a
                    href={`https://maps.google.com/?q=${encodeURIComponent(event.venue)}`}
                    className="ev-loc-link"
                    target="_blank"
                    rel="noopener noreferrer"
                  >
                    Open in Maps →
                  </a>
                </div>
              </div>
            </section>
          )}

        </div>

        {/* ── RIGHT SIDEBAR ── */}
        <div className="ev-right">

          {/* TICKET SELECTION */}
          <div className="ev-ticket-box">
            <div className="ev-ticket-box-head">
              <span className="ev-tb-label">TICKETS</span>
              <span className="ev-tb-avail">
                {isOpen ? '● Registration open' : '○ Registration closed'}
              </span>
            </div>
            <div className="ev-ticket-list">
              {activeTickets.length > 0 ? (
                activeTickets.map((tk: TicketType, i: number) => (
                  <div key={tk.id} className={`ev-tk${i === 0 ? ' ev-tk-sel' : ''}`}>
                    <div className="ev-tk-l">
                      <div className="ev-tk-name">{tk.name}</div>
                      {tk.description && <div className="ev-tk-desc">{tk.description}</div>}
                    </div>
                    <div className="ev-tk-r">
                      <div className={`ev-tk-price${tk.price === 0 ? ' ev-tk-price-free' : ''}`}>
                        {formatPrice(tk.price)}
                      </div>
                      {tk.capacity && (
                        <div className="ev-tk-cap">
                          {tk.capacity} spots
                        </div>
                      )}
                    </div>
                    <div className="ev-tk-radio" />
                  </div>
                ))
              ) : (
                <div className="ev-tk">
                  <div className="ev-tk-l">
                    <div className="ev-tk-name">No tickets available</div>
                  </div>
                </div>
              )}
            </div>
          </div>

          {/* ORDER SUMMARY (show for first active ticket) */}
          {activeTickets.length > 0 && (
            <div className="ev-order-box">
              <div className="ev-order-row">
                <span className="ev-or-l">Ticket</span>
                <span className="ev-or-v">{activeTickets[0].name} × 1</span>
              </div>
              <div className="ev-order-row">
                <span className="ev-or-l">Platform fee</span>
                <span className="ev-or-v ev-or-v-free">₹0 — Free</span>
              </div>
              <div className="ev-order-row ev-order-total">
                <span className="ev-or-tot-l">TOTAL</span>
                <span className="ev-or-tot">{formatPrice(activeTickets[0].price)}</span>
              </div>
            </div>
          )}

          {isOpen && (
            <Link href={`/events/${slug}/register`} className="ev-reg-btn">
              Register Now →
            </Link>
          )}
          <div className="ev-sec-note">
            <span>🔒</span> Secured by Gatepass · Zero platform fees
          </div>

          {/* SHARE */}
          <div className="ev-share-row">
            <button className="ev-share-btn" type="button">↗ Share</button>
            <button className="ev-share-btn" type="button">📅 Save date</button>
            <button className="ev-share-btn" type="button">🔗 Copy link</button>
          </div>

          {/* ORGANIZER */}
          <div className="ev-org-card">
            <div className="ev-org-head">
              <div className="ev-org-av">{organizerInitials}</div>
              <div>
                <div className="ev-org-name">{organizerName}</div>
                <div className="ev-org-sub">Event organizer</div>
              </div>
            </div>
            <button className="ev-org-contact" type="button">
              ✉ Contact organizer
            </button>
          </div>

        </div>
      </div>

      {/* ── FOOTER ───────────────────────────────────────────────── */}
      <footer className="ev-footer">
        <div className="ev-footer-logo">
          GATE<span>PASS</span>
        </div>
        <div className="ev-footer-note">
          Free, open-source event platform · MIT Licensed · Built for India
        </div>
      </footer>

      {/* ── MOBILE STICKY CTA ────────────────────────────────────── */}
      {isOpen && activeTickets.length > 0 && (
        <div className="ev-mob-cta">
          <div className="ev-mob-cta-inner">
            <div className="ev-mob-cta-info">
              <div className="ev-mob-cta-price">{formatPrice(activeTickets[0].price)}</div>
              <div className="ev-mob-cta-label">{activeTickets[0].name}</div>
            </div>
            <Link href={`/events/${slug}/register`} className="ev-mob-cta-btn">
              Register Now →
            </Link>
          </div>
        </div>
      )}
    </>
  );
}
