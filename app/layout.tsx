import type { Metadata, Viewport } from "next";
import { Geist, Geist_Mono, Syne } from "next/font/google";

import { SessionSync } from "@/components/auth/session-sync";
import { BottomNav } from "@/components/layout/bottom-nav";

import "./globals.css";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

const syne = Syne({
  variable: "--font-pu-heading",
  subsets: ["latin"],
  weight: ["700", "800"],
});

export const metadata: Metadata = {
  metadataBase: new URL(
    process.env.NEXT_PUBLIC_SITE_URL ?? "http://localhost:3000"
  ),
  applicationName: "Pull Up",
  title: {
    default: "Pull Up — What's the move tonight?",
    template: "%s · Pull Up",
  },
  description: "The live pulse of campus.",
  manifest: "/manifest.webmanifest",
  appleWebApp: {
    capable: true,
    title: "PU",
    statusBarStyle: "black-translucent",
  },
  formatDetection: {
    telephone: false,
  },
};

export const viewport: Viewport = {
  width: "device-width",
  initialScale: 1,
  viewportFit: "cover",
  themeColor: "#09090b",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html
      lang="en"
      className={`dark ${geistSans.variable} ${geistMono.variable} ${syne.variable} h-full antialiased`}
    >
      <body className="flex min-h-dvh flex-col bg-transparent pb-[calc(5.75rem+env(safe-area-inset-bottom))] text-foreground">
        <SessionSync />
        {children}
        <BottomNav />
      </body>
    </html>
  );
}
