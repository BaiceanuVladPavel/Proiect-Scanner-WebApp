import type { Metadata } from "next";
import type { Viewport } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import { AuthSession } from "@/components/auth/auth-session";
import { OfflineFoundation } from "@/components/offline/offline-foundation";
import { MobileNav } from "@/components/ui/mobile-nav";
import { ToastViewport } from "@/components/ui/toast-viewport";
import "./globals.css";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: "Inventory Scanner",
  description: "iPhone-first inventory scanner PWA",
  manifest: "/manifest.webmanifest",
  appleWebApp: {
    capable: true,
    statusBarStyle: "black-translucent",
    title: "Inventory Scanner",
  },
  applicationName: "Inventory Scanner",
  formatDetection: {
    telephone: false,
  },
  icons: {
    apple: [
      { url: "/apple-icon", sizes: "180x180", type: "image/png" },
    ],
    icon: [
      { url: "/icon?size=192", sizes: "192x192", type: "image/png" },
      { url: "/icon?size=512", sizes: "512x512", type: "image/png" },
    ],
  },
};

export const viewport: Viewport = {
  themeColor: "#020617",
  viewportFit: "cover",
  width: "device-width",
  initialScale: 1,
  maximumScale: 1,
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html
      lang="en"
      className={`${geistSans.variable} ${geistMono.variable} dark h-full antialiased`}
    >
      <head>
        <meta name="apple-mobile-web-app-capable" content="yes" />
        <meta name="apple-mobile-web-app-status-bar-style" content="black-translucent" />
        <meta name="apple-mobile-web-app-title" content="Inventory Scanner" />
        <meta name="mobile-web-app-capable" content="yes" />
        <meta name="theme-color" content="#020617" />
        <link rel="apple-touch-startup-image" href="/splash/iphone-14-pro-max.svg" media="(device-width: 430px) and (device-height: 932px) and (-webkit-device-pixel-ratio: 3) and (orientation: portrait)" />
        <link rel="apple-touch-startup-image" href="/splash/iphone-14-pro.svg" media="(device-width: 393px) and (device-height: 852px) and (-webkit-device-pixel-ratio: 3) and (orientation: portrait)" />
        <link rel="apple-touch-startup-image" href="/splash/iphone-13-mini.svg" media="(device-width: 375px) and (device-height: 812px) and (-webkit-device-pixel-ratio: 3) and (orientation: portrait)" />
      </head>
      <body className="min-h-full flex flex-col bg-background text-foreground">
        <AuthSession />
        <OfflineFoundation />
        <ToastViewport />
        {children}
        <MobileNav />
      </body>
    </html>
  );
}
