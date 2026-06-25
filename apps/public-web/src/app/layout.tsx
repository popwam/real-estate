import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import { PublicShell } from "@/components/public/public-shell";
import { TrackingPlaceholders } from "@/components/tracking/tracking-placeholders";
import { FirstPartyVisitorTracking } from "@/components/tracking/first-party-visitor-tracking";
import { Suspense } from "react";
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

const publicPreferenceBootstrap = `
(function () {
  try {
    var theme = localStorage.getItem("popwam-theme");
    var fontScale = localStorage.getItem("popwam-font-scale");
    var locale = localStorage.getItem("popwam-locale");
    var root = document.documentElement;

    root.dataset.theme = theme === "dark" || theme === "comfort" ? theme : "light";
    root.dataset.fontScale =
      fontScale === "large" || fontScale === "extra-large" ? fontScale : "normal";
    root.lang = locale === "ar" || locale === "fr" ? locale : "en";
    root.dir = locale === "ar" ? "rtl" : "ltr";
  } catch (error) {}
})();
`;

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html
      lang="en"
      dir="ltr"
      suppressHydrationWarning
      className={`${geistSans.variable} ${geistMono.variable} h-full antialiased`}
    >
      <body className="flex min-h-full flex-col">
        <script dangerouslySetInnerHTML={{ __html: publicPreferenceBootstrap }} />
        <PublicWebProviders>
          <TrackingPlaceholders />
          <Suspense fallback={null}><FirstPartyVisitorTracking /></Suspense>
          <PublicShell>{children}</PublicShell>
        </PublicWebProviders>
      </body>
    </html>
  );
}
