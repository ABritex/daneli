import type { MetadataRoute } from "next";
import { getWorks } from "@/lib/db-content";
import { siteConfig } from "@/lib/site";

const SITE_LAST_MODIFIED = new Date("2026-11-26");

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
    const works = await getWorks();
    const staticRoutes: MetadataRoute.Sitemap = ["", "/contact", "/resume"].map((route) => ({
        url: `${siteConfig.url}${route}`,
        lastModified: SITE_LAST_MODIFIED,
        changeFrequency: route === "" ? "weekly" : "monthly",
        priority: route === "" ? 1 : 0.7,
    }));

    const workRoutes: MetadataRoute.Sitemap = works
        .filter((work) => work.href?.startsWith("/work/"))
        .map((work) => ({
            url: `${siteConfig.url}${work.href}`,
            lastModified: SITE_LAST_MODIFIED,
            changeFrequency: "monthly",
            priority: 0.8,
        }));

    return [...staticRoutes, ...workRoutes];
}
