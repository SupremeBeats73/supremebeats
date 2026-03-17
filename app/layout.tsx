import type { Metadata } from "next";
import { Geist, Geist_Mono, Inter } from "next/font/google";
import "./globals.css";
import { AuthProvider } from "./context/AuthContext";
import { JobsProvider } from "./context/JobsContext";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

const inter = Inter({
  variable: "--font-inter",
  subsets: ["latin"],
  weight: ["600", "700", "800"],
});

const siteUrl = process.env.NEXT_PUBLIC_SITE_URL || "https://www.supremebeatsstudio.com";

export const metadata: Metadata = {
  metadataBase: new URL(siteUrl),
  title: {
    default: "SupremeBeats Studio",
    template: "%s | SupremeBeats Studio",
  },
  description: "The ultimate studio for AI-generated beats and music production.",
  openGraph: {
    title: "SupremeBeats Studio",
    description: "Create, edit, and deploy beats in seconds.",
    url: siteUrl,
    siteName: "SupremeBeats Studio",
    locale: "en_US",
    type: "website",
  },
  robots: {
    index: true,
    follow: true,
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
        <meta name="facebook-domain-verification" content="7bpmemx1x2mggk0d1jbpuliuzhx754" />
      </head>
      <body
        className={`${geistSans.variable} ${geistMono.variable} ${inter.variable} antialiased`}
      >
        <AuthProvider>
        <JobsProvider>{children}</JobsProvider>
      </AuthProvider>
      </body>
    </html>
  );
}