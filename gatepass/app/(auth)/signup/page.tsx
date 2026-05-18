'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { createClient } from '@/lib/supabase/client';

type PasswordStrength = 'weak' | 'fair' | 'strong' | null;

function getPasswordStrength(pw: string): PasswordStrength {
  if (!pw) return null;
  if (pw.length < 6) return 'weak';
  if (pw.length <= 10) return 'fair';
  return 'strong';
}

export default function SignupPage() {
  const router = useRouter();
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [firstName, setFirstName] = useState('');
  const [lastName, setLastName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [agreed, setAgreed] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const strength = getPasswordStrength(password);

  async function handleGoogleAuth() {
    const supabase = createClient();
    await supabase.auth.signInWithOAuth({
      provider: 'google',
      options: { redirectTo: `${window.location.origin}/auth/callback` },
    });
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    setLoading(true);

    const fullName = `${firstName} ${lastName}`.trim();

    try {
      const supabase = createClient();

      // 1. Sign up with Supabase Auth
      const { data, error: authError } = await supabase.auth.signUp({
        email,
        password,
        options: {
          data: {
            full_name: fullName,
          },
        },
      });

      if (authError) {
        setError(authError.message);
        setLoading(false);
        return;
      }

      // 2. Insert profile row
      if (data.user) {
        const { error: profileError } = await supabase
          .from('profiles')
          .insert({
            id: data.user.id,
            full_name: fullName,
          });

        if (profileError) {
          // Log but don't block — profile can be created later via trigger
          console.error('Profile insert failed:', profileError.message);
        }
      }

      // 3. Redirect to dashboard
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
          <div className="auth-card-tag">Free forever</div>
          <h1 className="auth-card-title">GET STARTED.</h1>
          <p className="auth-card-sub">Create your Gatepass account — zero platform fees</p>
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
            aria-label="Sign up with Google"
          >
            <svg className="auth-soc-ico" viewBox="0 0 18 18" fill="none" aria-hidden="true">
              <path d="M17.64 9.2c0-.637-.057-1.251-.164-1.84H9v3.481h4.844a4.14 4.14 0 01-1.796 2.716v2.259h2.908c1.702-1.567 2.684-3.875 2.684-6.615z" fill="#4285F4" />
              <path d="M9 18c2.43 0 4.467-.806 5.956-2.18l-2.908-2.259c-.806.54-1.837.86-3.048.86-2.344 0-4.328-1.584-5.036-3.711H.957v2.332A8.997 8.997 0 009 18z" fill="#34A853" />
              <path d="M3.964 10.71A5.41 5.41 0 013.682 9c0-.593.102-1.17.282-1.71V4.958H.957A8.996 8.996 0 000 9c0 1.452.348 2.827.957 4.042l3.007-2.332z" fill="#FBBC05" />
              <path d="M9 3.58c1.321 0 2.508.454 3.44 1.345l2.582-2.58C13.463.891 11.426 0 9 0A8.997 8.997 0 00.957 4.958L3.964 7.29C4.672 5.163 6.656 3.58 9 3.58z" fill="#EA4335" />
            </svg>
            Sign up with Google
          </button>

          {/* Divider */}
          <div className="auth-or" role="separator">
            <div className="auth-or-line" />
            <span className="auth-or-txt">or</span>
            <div className="auth-or-line" />
          </div>

          {/* Form */}
          <form onSubmit={handleSubmit} noValidate>
            {/* First + Last name row */}
            <div className="auth-fi-row">
              <div className="auth-fgrp">
                <label htmlFor="signup-firstname" className="auth-flbl">
                  First Name
                </label>
                <input
                  id="signup-firstname"
                  type="text"
                  className="auth-fi"
                  placeholder="Amal"
                  autoComplete="given-name"
                  value={firstName}
                  onChange={(e) => setFirstName(e.target.value)}
                  required
                />
              </div>
              <div className="auth-fgrp">
                <label htmlFor="signup-lastname" className="auth-flbl">
                  Last Name
                </label>
                <input
                  id="signup-lastname"
                  type="text"
                  className="auth-fi"
                  placeholder="Mathew"
                  autoComplete="family-name"
                  value={lastName}
                  onChange={(e) => setLastName(e.target.value)}
                  required
                />
              </div>
            </div>

            <div className="auth-fgrp">
              <label htmlFor="signup-email" className="auth-flbl">
                Work Email
              </label>
              <input
                id="signup-email"
                type="email"
                className="auth-fi"
                placeholder="you@college.edu"
                autoComplete="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
              />
            </div>

            <div className="auth-fgrp">
              <label htmlFor="signup-password" className="auth-flbl">
                Password
              </label>
              <div className="auth-pw-wrap">
                <input
                  id="signup-password"
                  type={showPassword ? 'text' : 'password'}
                  className="auth-fi"
                  placeholder="Min. 8 characters"
                  autoComplete="new-password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  required
                  minLength={8}
                />
                <button
                  type="button"
                  className="auth-pw-eye"
                  onClick={() => setShowPassword((v) => !v)}
                  aria-label={showPassword ? 'Hide password' : 'Show password'}
                >
                  {showPassword ? (
                    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                      <path d="M17.94 17.94A10.07 10.07 0 0112 20c-7 0-11-8-11-8a18.45 18.45 0 015.06-5.94" />
                      <path d="M9.9 4.24A9.12 9.12 0 0112 4c7 0 11 8 11 8a18.5 18.5 0 01-2.16 3.19" />
                      <line x1="1" y1="1" x2="23" y2="23" />
                    </svg>
                  ) : (
                    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                      <path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z" />
                      <circle cx="12" cy="12" r="3" />
                    </svg>
                  )}
                </button>
              </div>

              {/* Password strength indicator */}
              {password.length > 0 && strength && (
                <div className="auth-pw-strength" role="status" aria-live="polite">
                  <div className="auth-pw-bars" aria-hidden="true">
                    <div className={`auth-pw-bar ${strength === 'weak' || strength === 'fair' || strength === 'strong' ? strength : ''}`} />
                    <div className={`auth-pw-bar ${strength === 'fair' || strength === 'strong' ? strength : ''}`} />
                    <div className={`auth-pw-bar ${strength === 'strong' ? strength : ''}`} />
                  </div>
                  <span className={`auth-pw-label ${strength}`}>
                    {strength.charAt(0).toUpperCase() + strength.slice(1)}
                  </span>
                </div>
              )}
            </div>

            {/* Terms checkbox */}
            <div className="auth-check-row">
              <input
                id="signup-terms"
                type="checkbox"
                checked={agreed}
                onChange={(e) => setAgreed(e.target.checked)}
                required
              />
              <label htmlFor="signup-terms">
                I agree to the{' '}
                <Link href="/terms">Terms of Service</Link>
                {' '}and{' '}
                <Link href="/privacy">Privacy Policy</Link>
              </label>
            </div>

            <button
              type="submit"
              className={`auth-submit${loading ? ' loading' : ''}`}
              disabled={loading || !agreed}
              aria-busy={loading}
            >
              {loading ? (
                <>
                  <span className="auth-spinner" aria-hidden="true" />
                  Creating account…
                </>
              ) : (
                'Create free account →'
              )}
            </button>
          </form>

          <p className="auth-sw">
            Already have an account?{' '}
            <Link href="/login">Sign in →</Link>
          </p>
        </div>
      </div>
    </main>
  );
}
