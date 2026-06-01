import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import { PublicFooter } from "@/components/public/public-footer";
import { PublicBottomNav } from "@/components/public/public-bottom-nav";
import { PublicHeader } from "@/components/public/public-header";
import { TrackingPlaceholders } from "@/components/tracking/tracking-placeholders";
import { PublicWebProviders } from "@/app/providers";
import { defaultMetadata } from "@/lib/seo";
import "./globals.css";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

export const metadata: Metadata = defaultMetadata;

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html
      lang="en"
      className={`${geistSans.variable} ${geistMono.variable} h-full antialiased`}
    >
      <body className="flex min-h-full flex-col">
        <PublicWebProviders>
          <TrackingPlaceholders />
          <PublicHeader />
          <main className="flex-1 pb-[calc(var(--bottom-nav-height)+env(safe-area-inset-bottom)+1.5rem)] md:pb-0">
            {children}
          </main>
          <PublicFooter />
          <PublicBottomNav />
        </PublicWebProviders>
      </body>
    </html>
  );
}
