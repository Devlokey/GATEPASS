'use client';

import { useEffect } from 'react';

interface ResultData {
  valid: boolean;
  attendee_name?: string;
  ticket_type?: string;
  already_checked_in?: boolean;
  checked_in_at?: string;
  message?: string;
}

interface TicketResultProps {
  result: ResultData | null;
  onDismiss: () => void;
}

export default function TicketResult({ result, onDismiss }: TicketResultProps) {
  useEffect(() => {
    if (!result) return;
    const timer = setTimeout(onDismiss, 4000);
    return () => clearTimeout(timer);
  }, [result, onDismiss]);

  if (!result) return null;

  const isSuccess = result.valid && !result.already_checked_in;
  const isWarning = result.already_checked_in;

  let bgColor = '#dc2626';
  let icon = '❌';
  if (isSuccess) { bgColor = '#16a34a'; icon = '✅'; }
  else if (isWarning) { bgColor = '#d97706'; icon = '⚠️'; }

  let formattedTime = '';
  if (result.checked_in_at) {
    try {
      formattedTime = new Date(result.checked_in_at).toLocaleString();
    } catch {
      formattedTime = result.checked_in_at;
    }
  }

  return (
    <div
      style={{
        background: bgColor,
        color: '#fff',
        borderRadius: '10px',
        padding: '20px 28px',
        margin: '16px 0',
        minWidth: '280px',
        maxWidth: '400px',
        textAlign: 'center',
        boxShadow: '0 4px 16px rgba(0,0,0,0.18)',
      }}
    >
      <div style={{ fontSize: '36px', marginBottom: '8px' }}>{icon}</div>
      {result.attendee_name && (
        <div style={{ fontSize: '20px', fontWeight: 700, marginBottom: '4px' }}>
          {result.attendee_name}
        </div>
      )}
      {result.ticket_type && (
        <div style={{ fontSize: '14px', opacity: 0.88, marginBottom: '6px' }}>
          {result.ticket_type}
        </div>
      )}
      {isSuccess && (
        <div style={{ fontSize: '16px', fontWeight: 600, letterSpacing: '0.04em' }}>
          CHECK-IN SUCCESSFUL
        </div>
      )}
      {isWarning && (
        <>
          <div style={{ fontSize: '15px', fontWeight: 600 }}>Already checked in</div>
          {formattedTime && (
            <div style={{ fontSize: '13px', opacity: 0.85, marginTop: '4px' }}>{formattedTime}</div>
          )}
        </>
      )}
      {!result.valid && (
        <div style={{ fontSize: '15px', fontWeight: 600 }}>
          {result.message || 'Invalid QR code'}
        </div>
      )}
    </div>
  );
}
