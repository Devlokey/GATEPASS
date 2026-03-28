"use client";

import { useEffect, useRef, useState } from "react";
import { Html5Qrcode } from "html5-qrcode";

type ScanResult = {
  success: boolean;
  message: string;
  attendee_name?: string;
  ticket_type?: string;
  already_checked_in?: boolean;
};

interface QrScannerProps {
  eventId: string;
}

export default function QrScanner({ eventId }: QrScannerProps) {
  const qrRef = useRef<Html5Qrcode | null>(null);
  const [scanning, setScanning] = useState(false);
  const [result, setResult] = useState<ScanResult | null>(null);
  const [loading, setLoading] = useState(false);
  const elementId = "qr-scanner-container";

  async function processQrCode(decodedText: string) {
    if (loading) return;
    setLoading(true);

    try {
      const res = await fetch("/api/checkin", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ qr_code: decodedText, event_id: eventId }),
      });
      const data: ScanResult = await res.json();
      setResult(data);
    } catch {
      setResult({ success: false, message: "Network error. Try again." });
    } finally {
      setLoading(false);
    }

    // Auto-clear result after 3 seconds and resume scanning
    setTimeout(() => setResult(null), 3000);
  }

  async function startScanner() {
    const qr = new Html5Qrcode(elementId);
    qrRef.current = qr;

    const cameras = await Html5Qrcode.getCameras();
    const cameraId = cameras[cameras.length - 1]?.id ?? cameras[0]?.id; // prefer back camera

    await qr.start(
      cameraId,
      { fps: 10, qrbox: { width: 250, height: 250 } },
      processQrCode,
      () => {} // ignore decode errors (continuous scanning)
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
      if (qrRef.current?.isScanning) { qrRef.current.stop().catch(() => {}); }
    };
  }, []);

  return (
    <div className="qr-scanner-wrapper">
      <div id={elementId} className="qr-viewfinder" />

      {result && (
        <div className={`scan-result ${result.success ? "success" : result.already_checked_in ? "warning" : "error"}`}>
          <div className="scan-result-icon">
            {result.success ? "✅" : result.already_checked_in ? "⚠️" : "❌"}
          </div>
          <div className="scan-result-name">{result.attendee_name ?? ""}</div>
          {result.ticket_type && <div className="scan-result-ticket">{result.ticket_type}</div>}
          <div className="scan-result-message">{result.message}</div>
        </div>
      )}

      <div className="scanner-controls">
        {!scanning ? (
          <button className="btn-scan" onClick={startScanner}>
            📷 Start Scanner
          </button>
        ) : (
          <button className="btn-scan btn-stop" onClick={stopScanner}>
            ⏹ Stop Scanner
          </button>
        )}
      </div>
    </div>
  );
}
