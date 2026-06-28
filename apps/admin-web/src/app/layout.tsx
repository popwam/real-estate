import type { Metadata } from "next";
import "./globals.css";
import { Providers } from "@/app/providers";

export const metadata: Metadata = {
  title: "POPWAM Admin",
  description: "Admin dashboards for POPWAM verified real estate marketplace",
};

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
      className="h-full antialiased"
    >
      <body className="min-h-full bg-[var(--color-background)] text-[var(--color-foreground)]">
        <Providers>{children}</Providers>
      </body>
    </html>
  );
}
