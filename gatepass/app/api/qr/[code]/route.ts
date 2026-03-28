import { NextRequest, NextResponse } from "next/server";
import QRCode from "qrcode";

// GET /api/qr/[code]
// Generates and returns a QR code PNG image for the given code string.
// Used in confirmation emails: <img src="/api/qr/UUID" />
// Public route — no auth required (code is a UUID, not guessable en masse)

export async function GET(
  _request: NextRequest,
  { params }: { params: { code: string } }
) {
  const { code } = params;

  if (!code) {
    return new NextResponse("Missing code", { status: 400 });
  }

  try {
    const pngBuffer = await QRCode.toBuffer(code, {
      type: "png",
      width: 300,
      margin: 2,
      color: {
        dark: "#000000",
        light: "#ffffff",
      },
    });

    return new NextResponse(pngBuffer, {
      headers: {
        "Content-Type": "image/png",
        "Cache-Control": "public, max-age=86400, immutable",
      },
    });
  } catch (err) {
    console.error("QR generation error:", err);
    return new NextResponse("Failed to generate QR code", { status: 500 });
  }
}
