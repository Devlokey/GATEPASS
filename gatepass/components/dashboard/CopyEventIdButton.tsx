'use client';

import { useState } from 'react';

interface CopyEventIdButtonProps {
  eventId: string;
}

export default function CopyEventIdButton({ eventId }: CopyEventIdButtonProps) {
  const [copied, setCopied] = useState(false);

  async function handleCopy() {
    try {
      await navigator.clipboard.writeText(eventId);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch {
      // Fallback for browsers that block clipboard without HTTPS
      const el = document.createElement('textarea');
      el.value = eventId;
      document.body.appendChild(el);
      el.select();
      document.execCommand('copy');
      document.body.removeChild(el);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    }
  }

  return (
    <button
      onClick={handleCopy}
      title={`Event ID: ${eventId}`}
      style={{
        width: '100%',
        padding: '0.35rem 0',
        fontSize: '0.75rem',
        color: copied ? '#16a34a' : '#6b7280',
        background: 'transparent',
        border: '1px dashed #d1d5db',
        borderRadius: '0.4rem',
        cursor: 'pointer',
        fontFamily: 'monospace',
        overflow: 'hidden',
        textOverflow: 'ellipsis',
        whiteSpace: 'nowrap',
      }}
    >
      {copied ? 'Copied!' : `ID: ${eventId.slice(0, 8)}… (copy)`}
    </button>
  );
}
