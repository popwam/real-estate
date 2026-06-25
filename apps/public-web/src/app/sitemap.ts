import type { MetadataRoute } from "next";
import {
  listPublicProjects,
  getPublicBrokerageBySlug,
  getPublicDeveloperBySlug,
} from "@/lib/public-data";
import { getSiteBaseUrl } from "@/lib/seo";

const staticPaths = ["/", "/projects", "/landing/northline-launch", "/landing/coastline-summer"];
const fallbackStaticPaths = [
  ...staticPaths,
  "/developers/northline-development-group",
  "/brokerages/northline-brokerage-collective",
];

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const baseUrl = getSiteBaseUrl();
  const dynamicPaths = await getDynamicSitemapPaths();
  const paths = dynamicPaths
    ? [...staticPaths, ...dynamicPaths]
    : fallbackStaticPaths;

  return uniquePaths(paths).map((path) => ({
    url: new URL(path, baseUrl).toString(),
    lastModified: new Date(),
    changeFrequency: path === "/" ? "weekly" : "monthly",
    priority: path === "/" ? 1 : 0.7,
  }));
}

async function getDynamicSitemapPaths() {
  try {
    const [projects, developer, brokerage] = await Promise.all([
      listPublicProjects(),
      getPublicDeveloperBySlug("northline-development-group"),
      getPublicBrokerageBySlug("northline-brokerage-collective"),
    ]);

    return [
      ...projects.map((project) => `/projects/${project.slug}`),
      developer ? `/developers/${developer.slug}` : null,
      brokerage ? `/brokerages/${brokerage.slug}` : null,
    ].filter((path): path is string => Boolean(path));
  } catch {
    if (process.env.NODE_ENV !== "production") {
      console.warn(
        "[sitemap] Dynamic public routes skipped because public API data could not be loaded.",
      );
    }

    return null;
  }
}

function uniquePaths(paths: string[]) {
  return Array.from(new Set(paths));
}

