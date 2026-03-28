'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { createClient } from '@/lib/supabase/client';

export default function ResetPasswordPage() {
  const router = useRouter();
  const [password, setPassword] = useState('');
  const [confirm, setConfirm] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [done, setDone] = useState(false);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (password !== confirm) {
      setError('Passwords do not match.');
      return;
    }
    if (password.length < 8) {
      setError('Password must be at least 8 characters.');
      return;
    }
    setLoading(true);
    setError(null);
    try {
      const supabase = createClient();
      const { error: updateError } = await supabase.auth.updateUser({ password });
      if (updateError) {
        setError(updateError.message);
        return;
      }
      setDone(true);
      setTimeout(() => router.push('/dashboard'), 2000);
    } catch {
      setError('Something went wrong. Please try again.');
    } finally {
      setLoading(false);
    }
  }

  return (
    <main className="auth-page">
      <div className="auth-orbs" aria-hidden="true">
        <div className="auth-orb auth-orb-1" />
        <div className="auth-orb auth-orb-2" />
        <div className="auth-orb auth-orb-3" />
      </div>

      <div className="auth-card">
        {done ? (
          <div className="auth-success">
            <div className="auth-success-ring" role="img" aria-label="Success">✓</div>
            <p className="auth-success-title">PASSWORD UPDATED.</p>
            <p className="auth-success-sub">Redirecting to your dashboard…</p>
          </div>
        ) : (
          <>
            <div className="auth-card-top">
              <div className="auth-card-logo">
                <Link href="/">GATE<span>PASS</span></Link>
              </div>
              <div className="auth-card-tag">Account recovery</div>
              <h1 className="auth-card-title">NEW PASSWORD.</h1>
              <p className="auth-card-sub">Choose a strong password for your account</p>
            </div>

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
                  <label htmlFor="new-password" className="auth-flbl">New Password</label>
                  <input
                    id="new-password"
                    type="password"
                    className="auth-fi"
                    placeholder="Min. 8 characters"
                    autoComplete="new-password"
                    minLength={8}
                    required
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                  />
                </div>
                <div className="auth-fgrp">
                  <label htmlFor="confirm-password" className="auth-flbl">Confirm Password</label>
                  <input
                    id="confirm-password"
                    type="password"
                    className="auth-fi"
                    placeholder="Repeat password"
                    autoComplete="new-password"
                    required
                    value={confirm}
                    onChange={(e) => setConfirm(e.target.value)}
                  />
                </div>
                <button
                  type="submit"
                  className={`auth-submit${loading ? ' loading' : ''}`}
                  disabled={loading}
                  aria-busy={loading}
                >
                  {loading ? (
                    <><span className="auth-spinner" aria-hidden="true" />Updating…</>
                  ) : (
                    'Update password →'
                  )}
                </button>
              </form>
              <p className="auth-sw"><Link href="/login">← Back to sign in</Link></p>
            </div>
          </>
        )}
      </div>
    </main>
  );
}
