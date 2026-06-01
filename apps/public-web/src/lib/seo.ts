import type { Metadata } from "next";

const siteName = "POPWAM";
const baseUrl = process.env.NEXT_PUBLIC_SITE_URL ?? "https://popwam.com";
const defaultOgImage =
  "https://images.unsplash.com/photo-1486406146926-c627a92ad1ab?auto=format&fit=crop&w=1200&q=80";

type SeoInput = {
  title: string;
  description: string;
  path?: string;
  image?: string;
  noindex?: boolean;
};

export function createCanonicalUrl(path = "/") {
  return new URL(path, baseUrl).toString();
}

export function getSiteBaseUrl() {
  return baseUrl;
}

export function getDefaultOgImage() {
  return defaultOgImage;
}

export function createSeoMetadata({
  title,
  description,
  path = "/",
  image,
  noindex = false,
}: SeoInput): Metadata {
  const url = createCanonicalUrl(path);
  const fullTitle = title === siteName ? siteName : `${title} | ${siteName}`;
  const ogImage = image || defaultOgImage;

  return {
    title: fullTitle,
    description,
    alternates: {
      canonical: url,
    },
    openGraph: {
      title: fullTitle,
      description,
      siteName,
      type: "website",
      url,
      images: [{ url: ogImage, alt: title }],
    },
    twitter: {
      card: "summary_large_image",
      title: fullTitle,
      description,
      images: [ogImage],
    },
    robots: noindex
      ? {
          index: false,
          follow: false,
        }
      : undefined,
  };
}

export const defaultMetadata = createSeoMetadata({
  title: siteName,
  description:
    "Verified real estate marketplace infrastructure for developers, brokerages, and trusted public project discovery.",
});
