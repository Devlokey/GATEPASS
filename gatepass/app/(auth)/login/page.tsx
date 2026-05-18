'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { createClient } from '@/lib/supabase/client';

export default function LoginPage() {
  const router = useRouter();
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState<string | null>(null);

  async function handleGoogleAuth() {
    const supabase = createClient();
    await supabase.auth.signInWithOAuth({
      provider: 'google',
      options: { redirectTo: `${window.location.origin}/auth/callback` },
    });
  }

  async function handleGitHubAuth() {
    const supabase = createClient();
    await supabase.auth.signInWithOAuth({
      provider: 'github',
      options: { redirectTo: `${window.location.origin}/auth/callback` },
    });
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    setLoading(true);

    try {
      const supabase = createClient();
      const { error: authError } = await supabase.auth.signInWithPassword({
        email,
        password,
      });

      if (authError) {
        setError(authError.message);
        setLoading(false);
        return;
      }

      router.push('/dashboard');
    } catch {
      setError('Something went wrong. Please try again.');
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
        {/* Card top */}
        <div className="auth-card-top">
          <div className="auth-card-logo">
            <Link href="/">
              GATE<span>PASS</span>
            </Link>
          </div>
          <div className="auth-card-tag">Welcome back</div>
          <h1 className="auth-card-title">SIGN IN.</h1>
          <p className="auth-card-sub">Continue to your Gatepass dashboard</p>
        </div>

        {/* Card body */}
        <div className="auth-card-body">
          {/* Inline error message */}
          {error && (
            <div
              className="auth-ferr"
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

          {/* Social auth */}
          <button
            type="button"
            className="auth-soc-btn"
            onClick={handleGoogleAuth}
            aria-label="Continue with Google"
          >
            <svg className="auth-soc-ico" viewBox="0 0 18 18" fill="none" aria-hidden="true">
              <path d="M17.64 9.2c0-.637-.057-1.251-.164-1.84H9v3.481h4.844a4.14 4.14 0 01-1.796 2.716v2.259h2.908c1.702-1.567 2.684-3.875 2.684-6.615z" fill="#4285F4" />
              <path d="M9 18c2.43 0 4.467-.806 5.956-2.18l-2.908-2.259c-.806.54-1.837.86-3.048.86-2.344 0-4.328-1.584-5.036-3.711H.957v2.332A8.997 8.997 0 009 18z" fill="#34A853" />
              <path d="M3.964 10.71A5.41 5.41 0 013.682 9c0-.593.102-1.17.282-1.71V4.958H.957A8.996 8.996 0 000 9c0 1.452.348 2.827.957 4.042l3.007-2.332z" fill="#FBBC05" />
              <path d="M9 3.58c1.321 0 2.508.454 3.44 1.345l2.582-2.58C13.463.891 11.426 0 9 0A8.997 8.997 0 00.957 4.958L3.964 7.29C4.672 5.163 6.656 3.58 9 3.58z" fill="#EA4335" />
            </svg>
            Continue with Google
          </button>

          <button
            type="button"
            className="auth-soc-btn"
            onClick={handleGitHubAuth}
            aria-label="Continue with GitHub"
          >
            <svg className="auth-soc-ico" viewBox="0 0 18 18" fill="currentColor" aria-hidden="true">
              <path
                fillRule="evenodd"
                d="M9 0C4.03 0 0 4.03 0 9c0 3.98 2.58 7.35 6.16 8.54.45.08.61-.2.61-.44v-1.52c-2.5.54-3.03-1.21-3.03-1.21-.41-1.04-1-1.32-1-1.32-.82-.56.06-.55.06-.55.9.06 1.38.93 1.38.93.8 1.37 2.1.97 2.61.74.08-.58.31-.97.57-1.19-1.99-.23-4.08-1-4.08-4.44 0-.98.35-1.78.93-2.41-.09-.23-.4-1.14.09-2.37 0 0 .76-.24 2.49.93a8.67 8.67 0 012.27-.31c.77 0 1.55.1 2.27.31 1.73-1.17 2.49-.93 2.49-.93.49 1.23.18 2.14.09 2.37.58.63.93 1.43.93 2.41 0 3.45-2.1 4.21-4.1 4.43.32.28.61.83.61 1.67v2.48c0 .24.16.53.62.44A9.01 9.01 0 0018 9c0-4.97-4.03-9-9-9z"
                clipRule="evenodd"
              />
            </svg>
            Continue with GitHub
          </button>

          {/* Divider */}
          <div className="auth-or" role="separator">
            <div className="auth-or-line" />
            <span className="auth-or-txt">or continue with email</span>
            <div className="auth-or-line" />
          </div>

          {/* Form */}
          <form onSubmit={handleSubmit} noValidate>
            <div className="auth-fgrp">
              <label htmlFor="login-email" className="auth-flbl">
                Email
              </label>
              <input
                id="login-email"
                type="email"
                className="auth-fi"
                placeholder="you@example.com"
                autoComplete="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
              />
            </div>

            <div className="auth-fgrp">
              <label htmlFor="login-password" className="auth-flbl">
                Password
              </label>
              <div className="auth-pw-wrap">
                <input
                  id="login-password"
                  type={showPassword ? 'text' : 'password'}
                  className="auth-fi"
                  placeholder="••••••••"
                  autoComplete="current-password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  required
                />
                <button
                  type="button"
                  className="auth-pw-eye"
                  onClick={() => setShowPassword((v) => !v)}
                  aria-label={showPassword ? 'Hide password' : 'Show password'}
                >
                  {showPassword ? (
                    /* Eye-off icon */
                    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                      <path d="M17.94 17.94A10.07 10.07 0 0112 20c-7 0-11-8-11-8a18.45 18.45 0 015.06-5.94" />
                      <path d="M9.9 4.24A9.12 9.12 0 0112 4c7 0 11 8 11 8a18.5 18.5 0 01-2.16 3.19" />
                      <line x1="1" y1="1" x2="23" y2="23" />
                    </svg>
                  ) : (
                    /* Eye icon */
                    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                      <path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z" />
                      <circle cx="12" cy="12" r="3" />
                    </svg>
                  )}
                </button>
              </div>
            </div>

            <Link href="/forgot-password" className="auth-forgot">
              Forgot password?
            </Link>

            <button
              type="submit"
              className={`auth-submit${loading ? ' loading' : ''}`}
              disabled={loading}
              aria-busy={loading}
            >
              {loading ? (
                <>
                  <span className="auth-spinner" aria-hidden="true" />
                  Signing in…
                </>
              ) : (
                'Sign in →'
              )}
            </button>
          </form>

          <p className="auth-sw">
            Don&apos;t have an account?{' '}
            <Link href="/signup">Create one free →</Link>
          </p>
        </div>
      </div>
    </main>
  );
}
