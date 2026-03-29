import QRCode from "qrcode";

const QR_OPTIONS = {
  width: 300,
  margin: 2,
  errorCorrectionLevel: "M" as const,
  color: {
    dark: "#000000",
    light: "#ffffff",
  },
};

/**
 * Returns a base64 data URL of a QR code image (suitable for <img src={...}>).
 * @param text - UUID v4 qr_code value from registrations table
 */
export async function generateQRDataURL(text: string): Promise<string> {
  return QRCode.toDataURL(text, QR_OPTIONS);
}

/**
 * Returns a PNG buffer of a QR code image (suitable for HTTP responses).
 * @param text - UUID v4 qr_code value from registrations table
 */
export async function generateQRBuffer(text: string): Promise<Buffer> {
  return QRCode.toBuffer(text, {
    ...QR_OPTIONS,
    type: "png",
  });
}
