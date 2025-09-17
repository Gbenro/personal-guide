import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";
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
  title: "Personal Guide - AI-Powered Growth Assistant",
  description: "Your AI-powered companion for personal growth, habit tracking, and intelligent insights",
  manifest: "/manifest.json",
  themeColor: "#3b82f6",
  appleWebApp: {
    capable: true,
    statusBarStyle: "default",
    title: "Personal Guide",
  },
  formatDetection: {
    telephone: false,
  },
  openGraph: {
    type: "website",
    siteName: "Personal Guide",
    title: "Personal Guide - AI-Powered Growth Assistant",
    description: "Your AI-powered companion for personal growth, habit tracking, and intelligent insights",
  },
  twitter: {
    card: "summary",
    title: "Personal Guide - AI-Powered Growth Assistant",
    description: "Your AI-powered companion for personal growth, habit tracking, and intelligent insights",
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <head>
        <meta name="application-name" content="Personal Guide" />
        <meta name="apple-mobile-web-app-capable" content="yes" />
        <meta name="apple-mobile-web-app-status-bar-style" content="default" />
        <meta name="apple-mobile-web-app-title" content="Personal Guide" />
        <meta name="format-detection" content="telephone=no" />
        <meta name="mobile-web-app-capable" content="yes" />
        <meta name="msapplication-config" content="/icons/browserconfig.xml" />
        <meta name="msapplication-TileColor" content="#3b82f6" />
        <meta name="msapplication-tap-highlight" content="no" />
        <meta name="theme-color" content="#3b82f6" />

        <link rel="apple-touch-icon" href="/icons/touch-icon-120x120.png.svg" />
        <link rel="apple-touch-icon" sizes="152x152" href="/icons/touch-icon-152x152.png.svg" />
        <link rel="apple-touch-icon" sizes="180x180" href="/icons/touch-icon-180x180.png.svg" />
        <link rel="apple-touch-icon" sizes="167x167" href="/icons/touch-icon-167x167.png.svg" />

        <link rel="icon" type="image/svg+xml" sizes="32x32" href="/icons/favicon-32x32.png.svg" />
        <link rel="icon" type="image/svg+xml" sizes="16x16" href="/icons/favicon-16x16.png.svg" />
        <link rel="manifest" href="/manifest.json" />
        <link rel="shortcut icon" href="/favicon.ico" />
      </head>
      <body
        className={`${geistSans.variable} ${geistMono.variable} antialiased`}
      >
        {children}
      </body>
    </html>
  );
}
