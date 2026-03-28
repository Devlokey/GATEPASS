import type { Metadata } from "next";
import { Bebas_Neue, Syne, DM_Sans } from "next/font/google";
import localFont from "next/font/local";
import "./globals.css";
import { cn } from "@/lib/utils";

const geist = localFont({
  src: "./fonts/GeistVF.woff",
  variable: "--font-sans",
});

const bebasNeue = Bebas_Neue({
  weight: "400",
  subsets: ["latin"],
  variable: "--font-bebas",
});

const syne = Syne({
  subsets: ["latin"],
  weight: ["400", "600", "700", "800"],
  variable: "--font-syne",
});

const dmSans = DM_Sans({
  subsets: ["latin"],
  weight: ["300", "400", "500"],
  variable: "--font-dm-sans",
});

export const metadata: Metadata = {
  title: "Gatepass — Free Event Platform",
  description:
    "The free, open-source event management platform for Indian college events. Zero platform fee. MIT licensed.",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" className={cn(bebasNeue.variable, syne.variable, dmSans.variable, "font-sans", geist.variable)}>
      <body>
        {children}
      </body>
    </html>
  );
}
