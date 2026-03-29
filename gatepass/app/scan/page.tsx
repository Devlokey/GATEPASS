'use client';

import { useState } from 'react';
import QRReader from '@/components/scanner/QRReader';
import TicketResult from '@/components/scanner/TicketResult';

interface ResultData {
  valid: boolean;
  attendee_name?: string;
  ticket_type?: string;
  already_checked_in?: boolean;
  checked_in_at?: string;
  message?: string;
}

export default function ScanPage() {
  const [eventId, setEventId] = useState('');
  const [result, setResult] = useState<ResultData | null>(null);
  const [loading, setLoading] = useState(false);

  async function handleScan(qrCode: string) {
    if (loading) return;
    setLoading(true);

    try {
      const validateRes = await fetch('/api/validate', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ qr_code: qrCode, event_id: eventId }),
      });
      const validateData: ResultData = await validateRes.json();

      if (validateData.valid && !validateData.already_checked_in) {
        const checkinRes = await fetch('/api/checkin', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ qr_code: qrCode, event_id: eventId }),
        });
        const checkinData = await checkinRes.json();

        setResult({
          valid: checkinData.success ?? false,
          attendee_name: checkinData.attendee_name ?? validateData.attendee_name,
          ticket_type: checkinData.ticket_type ?? validateData.ticket_type,
          already_checked_in: checkinData.already_checked_in ?? false,
          message: checkinData.message,
        });
      } else {
        setResult(validateData);
      }
    } catch {
      setResult({ valid: false, message: 'Network error. Try again.' });
    } finally {
      setLoading(false);
    }
  }

  return (
    <div
      style={{
        minHeight: '100vh',
        background: '#f9fafb',
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        padding: '40px 16px',
        fontFamily: 'system-ui, sans-serif',
      }}
    >
      <h1 style={{ fontSize: '26px', fontWeight: 700, marginBottom: '24px', color: '#111' }}>
        QR Check-in Scanner
      </h1>

      <input
        type="text"
        placeholder="Paste Event ID (UUID)"
        value={eventId}
        onChange={(e) => setEventId(e.target.value)}
        style={{
          width: '100%',
          maxWidth: '400px',
          padding: '10px 14px',
          fontSize: '15px',
          border: '1px solid #d1d5db',
          borderRadius: '6px',
          marginBottom: '24px',
          outline: 'none',
          background: '#fff',
        }}
      />

      {eventId.length > 10 && <QRReader onScan={handleScan} />}

      <TicketResult result={result} onDismiss={() => setResult(null)} />

      {loading && (
        <div style={{ marginTop: '16px', color: '#6b7280', fontSize: '15px' }}>
          Processing...
        </div>
      )}
    </div>
  );
}
