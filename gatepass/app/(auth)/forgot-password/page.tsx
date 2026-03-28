'use client';

import { useState } from 'react';
import Link from 'next/link';
import { createClient } from '@/lib/supabase/client';

export default function ForgotPasswordPage() {
  const [email, setEmail] = useState('');
  const [loading, setLoading] = useState(false);
  const [sent, setSent] = useState(false);

  const [error, setError] = useState<string | null>(null);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);
    setError(null);
    try {
      const supabase = createClient();
      const { error: authError } = await supabase.auth.resetPasswordForEmail(email, {
        redirectTo: `${window.location.origin}/auth/reset-password`,
      });
      if (authError) {
        setError(authError.message);
        setLoading(false);
        return;
      }
      setSent(true);
    } catch {
      setError('Something went wrong. Please try again.');
    } finally {
      setLoading(false);
    }
  }

  return (
    <main className="auth-page">
      {/* Background orbs */}
      <div className="auth-orbs" aria-hidden="true">
        <div className="auth-orb auth-orb-1" />
        <div className="auth-orb auth-orb-2" />
        <div className="auth-orb auth-orb-3" />
      </div>

      <div className="auth-card">
        {sent ? (
          /* ── Success state ── */
          <div className="auth-success">
            <div className="auth-success-ring" role="img" aria-label="Success">
              ✓
            </div>
            <p className="auth-success-title">CHECK YOUR EMAIL.</p>
            <p className="auth-success-sub">
              We&apos;ve sent a password reset link to{' '}
              <strong style={{ color: 'var(--w)' }}>{email}</strong>. It expires in 15 minutes.
            </p>
            <p className="auth-sw" style={{ marginTop: 0 }}>
              <Link href="/login">← Back to sign in</Link>
            </p>
          </div>
        ) : (
          <>
            {/* Card top */}
            <div className="auth-card-top">
              <div className="auth-card-logo">
                <Link href="/">
                  GATE<span>PASS</span>
                </Link>
              </div>
              <div className="auth-card-tag">Account recovery</div>
              <h1 className="auth-card-title">RESET PASSWORD.</h1>
              <p className="auth-card-sub">
                Enter your email and we&apos;ll send a reset link
              </p>
            </div>

            {/* Card body */}
            <div className="auth-card-body">
              {error && (
                <div
                  role="alert"
                  style={{
                    background: 'rgba(248,113,113,.08)',
                    border: '1px solid rgba(248,113,113,.2)',
                    borderRadius: '8px',
                    padding: '10px 14px',
                    marginBottom: '16px',
                    fontSize: '12px',
                    lineHeight: '1.5',
                  }}
                >
                  {error}
                </div>
              )}
              <form onSubmit={handleSubmit} noValidate>
                <div className="auth-fgrp">
                  <label htmlFor="forgot-email" className="auth-flbl">
                    Email Address
                  </label>
                  <input
                    id="forgot-email"
                    type="email"
                    className="auth-fi"
                    placeholder="you@example.com"
                    autoComplete="email"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    required
                  />
                </div>

                <button
                  type="submit"
                  className={`auth-submit${loading ? ' loading' : ''}`}
                  disabled={loading}
                  aria-busy={loading}
                >
                  {loading ? (
                    <>
                      <span className="auth-spinner" aria-hidden="true" />
                      Sending…
                    </>
                  ) : (
                    'Send reset link →'
                  )}
                </button>
              </form>

              <p className="auth-sw">
                <Link href="/login">← Back to sign in</Link>
              </p>
            </div>
          </>
        )}
      </div>
    </main>
  );
}
