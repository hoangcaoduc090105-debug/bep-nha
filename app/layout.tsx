import type { Metadata, Viewport } from "next";
import { Be_Vietnam_Pro } from "next/font/google";
import "./globals.css";
import { ServiceWorker } from "@/components/service-worker";
import { SettingsApplier } from "@/components/settings-applier";

// Self-hosted at build time by next/font; drawn for Vietnamese diacritics.
const base = process.env.NEXT_PUBLIC_BASE_PATH ?? "";

const beVietnam = Be_Vietnam_Pro({
  variable: "--font-be-vietnam",
  subsets: ["vietnamese", "latin"],
  weight: ["400", "500", "600", "700"],
  display: "swap",
});

export const metadata: Metadata = {
  title: "Bếp Nhà",
  description: "Sổ tay nấu ăn của gia đình",
  robots: { index: false, follow: false }, // private family app
  icons: { icon: [{ url: `${base}/icon.svg`, type: "image/svg+xml" }, { url: `${base}/icon-192.png`, sizes: "192x192" }], apple: `${base}/apple-touch-icon.png` },
  appleWebApp: { capable: true, title: "Bếp Nhà", statusBarStyle: "default" },
};

// Nothing leaves the device: in the built site the browser itself refuses any connection to
// another server. The only outside content allowed, both for a dish rewritten from a video:
// the YouTube video she chooses to play, and that video's cover picture.
// (Not applied in development, where the dev server needs its own connections.)
const CSP = [
  "default-src 'self'",
  "script-src 'self' 'unsafe-inline'",
  "style-src 'self' 'unsafe-inline'",
  "img-src 'self' blob: data: https://i.ytimg.com",
  "font-src 'self'",
  "connect-src 'self'",
  "worker-src 'self'",
  "manifest-src 'self'",
  "frame-src https://www.youtube-nocookie.com",
  "object-src 'none'",
  "base-uri 'self'",
  "form-action 'self'",
].join("; ");

export const viewport: Viewport = {
  width: "device-width",
  initialScale: 1,
  themeColor: "#FBF6EC",
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="vi" className={`${beVietnam.variable} h-full antialiased`}>
      {process.env.NODE_ENV === "production" && (
        <head>
          <meta httpEquiv="Content-Security-Policy" content={CSP} />
        </head>
      )}
      <body className="min-h-full flex flex-col">
        <ServiceWorker />
        <SettingsApplier />
        {children}
      </body>
    </html>
  );
}
