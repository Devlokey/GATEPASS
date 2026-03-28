import { Resend } from "resend";

const resend = new Resend(process.env.RESEND_API_KEY!);
const FROM = "Gatepass <noreply@gatepass.app>";

// ──────────────────────────────────────────────
// Send confirmation email with QR code
// ──────────────────────────────────────────────
export async function sendConfirmationEmail(params: {
  to: string;
  attendeeName: string;
  eventTitle: string;
  eventDate: string;
  eventVenue: string;
  ticketType: string;
  qrCode: string;
  eventSlug: string;
}) {
  const appUrl = process.env.NEXT_PUBLIC_APP_URL!;

  await resend.emails.send({
    from: FROM,
    to: params.to,
    subject: `✅ You're registered for ${params.eventTitle}`,
    html: `
<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1">
</head>
<body style="font-family: 'Helvetica Neue', Helvetica, Arial, sans-serif; background: #0f0f0f; color: #fff; margin: 0; padding: 0;">
  <div style="max-width: 560px; margin: 0 auto; padding: 40px 20px;">
    <div style="text-align: center; margin-bottom: 32px;">
      <h1 style="font-size: 28px; font-weight: 700; color: #a855f7; margin: 0;">Gatepass</h1>
      <p style="color: #9ca3af; margin: 8px 0 0;">Zero fees. Open source.</p>
    </div>
    <div style="background: #1a1a1a; border-radius: 16px; padding: 32px; border: 1px solid #2a2a2a;">
      <h2 style="margin: 0 0 8px; font-size: 22px;">You're in! 🎉</h2>
      <p style="color: #9ca3af; margin: 0 0 24px;">Hi ${params.attendeeName}, your registration is confirmed.</p>
      <table style="width: 100%; border-collapse: collapse; margin-bottom: 24px;">
        <tr><td style="padding: 10px 0; color: #9ca3af; font-size: 14px; border-bottom: 1px solid #2a2a2a;">Event</td><td style="padding: 10px 0; font-weight: 600; text-align: right; border-bottom: 1px solid #2a2a2a;">${params.eventTitle}</td></tr>
        <tr><td style="padding: 10px 0; color: #9ca3af; font-size: 14px; border-bottom: 1px solid #2a2a2a;">Date</td><td style="padding: 10px 0; font-weight: 600; text-align: right; border-bottom: 1px solid #2a2a2a;">${params.eventDate}</td></tr>
        <tr><td style="padding: 10px 0; color: #9ca3af; font-size: 14px; border-bottom: 1px solid #2a2a2a;">Venue</td><td style="padding: 10px 0; font-weight: 600; text-align: right; border-bottom: 1px solid #2a2a2a;">${params.eventVenue}</td></tr>
        <tr><td style="padding: 10px 0; color: #9ca3af; font-size: 14px;">Ticket</td><td style="padding: 10px 0; font-weight: 600; text-align: right;">${params.ticketType}</td></tr>
      </table>
      <div style="text-align: center; background: #fff; border-radius: 12px; padding: 20px; margin-bottom: 24px;">
        <p style="color: #000; font-size: 13px; margin: 0 0 12px;">Scan this QR code at the entry gate</p>
        <img src="${appUrl}/api/qr/${params.qrCode}" alt="QR Code" style="width: 180px; height: 180px;" />
        <p style="color: #6b7280; font-size: 11px; margin: 12px 0 0; font-family: monospace;">${params.qrCode}</p>
      </div>
      <a href="${appUrl}/events/${params.eventSlug}" style="display: block; text-align: center; background: linear-gradient(135deg, #7c3aed, #a855f7); color: #fff; text-decoration: none; padding: 14px; border-radius: 10px; font-weight: 600;">View Event Page</a>
    </div>
    <p style="text-align: center; color: #4b5563; font-size: 12px; margin-top: 24px;">Built with ♥ for Indian college communities · <a href="${appUrl}" style="color: #7c3aed; text-decoration: none;">gatepass.app</a></p>
  </div>
</body>
</html>
    `,
  });
}

// ──────────────────────────────────────────────
// Send waitlist promotion email
// ──────────────────────────────────────────────
export async function sendWaitlistPromotionEmail(params: {
  to: string;
  attendeeName: string;
  eventTitle: string;
  eventSlug: string;
  qrCode: string;
}) {
  const appUrl = process.env.NEXT_PUBLIC_APP_URL!;

  await resend.emails.send({
    from: FROM,
    to: params.to,
    subject: `🎟️ You're off the waitlist — ${params.eventTitle}`,
    html: `
<!DOCTYPE html>
<html>
<body style="font-family: 'Helvetica Neue', Helvetica, Arial, sans-serif; background: #0f0f0f; color: #fff; margin: 0; padding: 40px 20px;">
  <div style="max-width: 560px; margin: 0 auto;">
    <h1 style="color: #a855f7;">Gatepass</h1>
    <div style="background: #1a1a1a; border-radius: 16px; padding: 32px; border: 1px solid #2a2a2a;">
      <h2>Great news, ${params.attendeeName}! 🎉</h2>
      <p style="color: #9ca3af;">A spot just opened up for <strong style="color: #fff;">${params.eventTitle}</strong>. You've been moved from the waitlist and your registration is now confirmed.</p>
      <div style="text-align: center; background: #fff; border-radius: 12px; padding: 20px; margin: 24px 0;">
        <img src="${appUrl}/api/qr/${params.qrCode}" alt="QR Code" style="width: 180px; height: 180px;" />
      </div>
      <a href="${appUrl}/events/${params.eventSlug}" style="display: block; text-align: center; background: linear-gradient(135deg, #7c3aed, #a855f7); color: #fff; text-decoration: none; padding: 14px; border-radius: 10px; font-weight: 600;">View Event</a>
    </div>
  </div>
</body>
</html>
    `,
  });
}

// ──────────────────────────────────────────────
// Send event reminder email
// ──────────────────────────────────────────────
export async function sendReminderEmail(params: {
  to: string;
  attendeeName: string;
  eventTitle: string;
  eventDate: string;
  eventVenue: string;
  eventSlug: string;
  qrCode: string;
}) {
  const appUrl = process.env.NEXT_PUBLIC_APP_URL!;

  await resend.emails.send({
    from: FROM,
    to: params.to,
    subject: `⏰ Reminder: ${params.eventTitle} is tomorrow!`,
    html: `
<!DOCTYPE html>
<html>
<body style="font-family: 'Helvetica Neue', Helvetica, Arial, sans-serif; background: #0f0f0f; color: #fff; margin: 0; padding: 40px 20px;">
  <div style="max-width: 560px; margin: 0 auto;">
    <h1 style="color: #a855f7;">Gatepass</h1>
    <div style="background: #1a1a1a; border-radius: 16px; padding: 32px; border: 1px solid #2a2a2a;">
      <h2>See you tomorrow, ${params.attendeeName}! 🚀</h2>
      <p style="color: #9ca3af;"><strong style="color: #fff;">${params.eventTitle}</strong> is happening tomorrow. Don't forget your QR code!</p>
      <p style="color: #9ca3af;">📍 ${params.eventVenue}<br>🗓 ${params.eventDate}</p>
      <div style="text-align: center; background: #fff; border-radius: 12px; padding: 20px; margin: 24px 0;">
        <img src="${appUrl}/api/qr/${params.qrCode}" alt="QR Code" style="width: 180px; height: 180px;" />
      </div>
      <a href="${appUrl}/events/${params.eventSlug}" style="display: block; text-align: center; background: linear-gradient(135deg, #7c3aed, #a855f7); color: #fff; text-decoration: none; padding: 14px; border-radius: 10px; font-weight: 600;">View Event</a>
    </div>
  </div>
</body>
</html>
    `,
  });
}
