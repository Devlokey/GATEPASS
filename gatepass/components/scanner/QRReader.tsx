'use client';

import { useEffect, useRef, useState } from 'react';
import { Html5Qrcode } from 'html5-qrcode';

interface QRReaderProps {
  onScan: (qrCode: string) => void;
}

export default function QRReader({ onScan }: QRReaderProps) {
  const qrRef = useRef<Html5Qrcode | null>(null);
  const [scanning, setScanning] = useState(false);
  const scanPaused = useRef(false);

  async function startScanner() {
    const qr = new Html5Qrcode('qr-reader-box');
    qrRef.current = qr;

    const cameras = await Html5Qrcode.getCameras();
    const cameraId = cameras[cameras.length - 1]?.id ?? cameras[0]?.id;

    await qr.start(
      cameraId,
      { fps: 10, qrbox: { width: 250, height: 250 } },
      (decodedText: string) => {
        if (scanPaused.current) return;
        scanPaused.current = true;
        onScan(decodedText);
        setTimeout(() => {
          scanPaused.current = false;
        }, 3000);
      },
      () => {}
    );
    setScanning(true);
  }

  async function stopScanner() {
    if (qrRef.current?.isScanning) {
      await qrRef.current.stop();
    }
    setScanning(false);
  }

  useEffect(() => {
    return () => {
      if (qrRef.current?.isScanning) {
        qrRef.current.stop().catch(() => {});
      }
    };
  }, []);

  return (
    <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '12px' }}>
      <div
        id="qr-reader-box"
        style={{ width: '300px', minHeight: '300px', background: '#111', borderRadius: '8px', overflow: 'hidden' }}
      />
      <div style={{ display: 'flex', gap: '8px' }}>
        {!scanning ? (
          <button
            onClick={startScanner}
            style={{
              padding: '10px 24px',
              background: '#2563eb',
              color: '#fff',
              border: 'none',
              borderRadius: '6px',
              cursor: 'pointer',
              fontSize: '15px',
            }}
          >
            Start Scanner
          </button>
        ) : (
          <button
            onClick={stopScanner}
            style={{
              padding: '10px 24px',
              background: '#dc2626',
              color: '#fff',
              border: 'none',
              borderRadius: '6px',
              cursor: 'pointer',
              fontSize: '15px',
            }}
          >
            Stop Scanner
          </button>
        )}
      </div>
    </div>
  );
}
