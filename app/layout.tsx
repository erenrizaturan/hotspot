import type { Metadata, Viewport } from "next";
import { Geist } from "next/font/google";
import "./globals.css";

const geist = Geist({ variable: "--font-geist", subsets: ["latin"] });

export const metadata: Metadata = {
  title: "HotSpot",
  description: "Düzensiz gelir için bütçe asistanı — kazanını bozmadan ne kadar harcayabileceğini gör.",
  applicationName: "HotSpot",
  manifest: "/manifest.webmanifest",
  appleWebApp: { capable: true, statusBarStyle: "black-translucent", title: "HotSpot" },
  formatDetection: { telephone: false },
};

export const viewport: Viewport = {
  width: "device-width",
  initialScale: 1,
  maximumScale: 1,
  userScalable: false,
  viewportFit: "cover",
  themeColor: "#0a0b0f",
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="tr" className={`${geist.variable} h-full`}>
      <body className="min-h-[100dvh] flex flex-col antialiased" style={{ background: "#0a0b0f", fontFamily: "var(--font-geist), system-ui, sans-serif", fontFeatureSettings: "'ss01'" }}>
        {children}
      </body>
    </html>
  );
}
