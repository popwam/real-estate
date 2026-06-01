import type { MetadataRoute } from "next";
import {
  listPublicProjects,
  getPublicBrokerageBySlug,
  getPublicDeveloperBySlug,
} from "@/lib/public-data";
import { getSiteBaseUrl } from "@/lib/seo";

const staticPaths = ["/", "/projects", "/landing/northline-launch", "/landing/coastline-summer"];

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const baseUrl = getSiteBaseUrl();
  const [projects, developer, brokerage] = await Promise.all([
    listPublicProjects(),
    getPublicDeveloperBySlug("demo-developer"),
    getPublicBrokerageBySlug("demo-brokerage"),
  ]);

  const dynamicPaths = [
    ...projects.map((project) => `/projects/${project.slug}`),
    developer ? `/developers/${developer.slug}` : null,
    brokerage ? `/brokerages/${brokerage.slug}` : null,
  ].filter((path): path is string => Boolean(path));

  return [...staticPaths, ...dynamicPaths].map((path) => ({
    url: new URL(path, baseUrl).toString(),
    lastModified: new Date(),
    changeFrequency: path === "/" ? "weekly" : "monthly",
    priority: path === "/" ? 1 : 0.7,
  }));
}

