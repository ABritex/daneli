import type { MetadataRoute } from "next";
import { works } from "@/features/works";
import { siteConfig } from "@/lib/site";

export default function sitemap(): MetadataRoute.Sitemap {
  const lastModified = new Date();

  const staticRoutes: MetadataRoute.Sitemap = ["", "/contact", "/resume"].map((route) => ({
    url: `${siteConfig.url}${route}`,
    lastModified,
    changeFrequency: route === "" ? "weekly" : "monthly",
    priority: route === "" ? 1 : 0.7,
  }));

  const workRoutes: MetadataRoute.Sitemap = works
    .filter((work) => work.href?.startsWith("/work/"))
    .map((work) => ({
      url: `${siteConfig.url}${work.href}`,
      lastModified,
      changeFrequency: "monthly",
      priority: 0.8,
    }));

  return [...staticRoutes, ...workRoutes];
}
