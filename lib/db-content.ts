import { and, asc, eq } from "drizzle-orm";
import { getDb } from "@/db";
import { heroImages, siteSettings, works as worksTable } from "@/db/schema";
import { ART, ART_MOBILE } from "@/features/landing-page/hero-section/config/art";
import { proxyMedia, works as staticWorks, type Work } from "@/features/works/data";

function toWork(row: typeof worksTable.$inferSelect): Work {
    return {
        id: row.sortOrder + 1,
        name: row.name,
        tags: row.tags ?? [],
        media: row.posterUrl ?? "",
        mediaCaption: row.posterCaption ?? "",
        video: row.videoUrl ?? undefined,
        href: row.href ?? `/work/${row.slug}`,
        url: row.liveUrl ?? undefined,
        description: row.description,
        year: row.year,
        client: row.client,
        role: row.role,
        gallery:
            Array.isArray(row.galleryItems) && row.galleryItems.length
                ? row.galleryItems.map((item) => ({ url: String(item.url ?? ""), caption: String(item.caption ?? "") })).filter((item) => item.url)
                : (row.gallery ?? []).map((url) => ({ url, caption: "" })),
    };
}

async function retryOnce<T>(label: string, fn: () => Promise<T>, fallback: T): Promise<T> {
    for (let attempt = 0; attempt < 2; attempt++) {
        try {
            return await fn();
        } catch (err) {
            const e = err as { name?: string; message?: string; code?: string; cause?: { message?: string; code?: string } };
            console.error(`db-content:${label}${attempt === 0 ? " (retrying)" : ""}`, {
                name: e?.name,
                message: e?.message,
                code: e?.code,
                cause: e?.cause ? { message: e.cause.message, code: e.cause.code } : undefined,
            });
            if (attempt === 1) return fallback;
        }
    }
    return fallback;
}

export async function getWorks(): Promise<Work[]> {
    return retryOnce(
        "getWorks",
        async () => {
            const db = getDb();
            const rows = await db.select().from(worksTable).where(eq(worksTable.published, true)).orderBy(asc(worksTable.sortOrder));
            if (!rows.length) return [];
            return rows.map(toWork);
        },
        staticWorks,
    );
}

export async function getWorkBySlug(slug: string): Promise<Work | undefined> {
    const fallback = staticWorks.find((w) => w.href === `/work/${slug}`);
    return retryOnce(
        "getWorkBySlug",
        async () => {
            const db = getDb();
            const [row] = await db
                .select()
                .from(worksTable)
                .where(and(eq(worksTable.slug, slug), eq(worksTable.published, true)))
                .limit(1);
            if (!row) return fallback;
            return toWork(row);
        },
        fallback,
    );
}

export async function getHeroArt(): Promise<{ desktop: string[]; mobile: string[] }> {
    const fallbackDesktop = ART.length ? ART : ["/media-placeholder.svg"];
    const fallbackMobile = ART_MOBILE.length ? ART_MOBILE : ["/media-placeholder.svg"];
    const fallback = { desktop: fallbackDesktop, mobile: fallbackMobile };
    return retryOnce(
        "getHeroArt",
        async () => {
            const db = getDb();
            const rows = await db.select().from(heroImages).where(eq(heroImages.active, true)).orderBy(asc(heroImages.sortOrder));
            if (!rows.length) return fallback;
            const desktop = rows.map((r) => proxyMedia(r.imageUrl));
            const mobile = rows.map((r) => proxyMedia(r.mobileImageUrl || r.imageUrl));
            return { desktop, mobile };
        },
        fallback,
    );
}

export async function getReelVideoUrl(): Promise<string> {
    return retryOnce(
        "getReelVideoUrl",
        async () => {
            const db = getDb();
            const [row] = await db.select().from(siteSettings).where(eq(siteSettings.key, "reel_video_url")).limit(1);
            const value = row?.value?.trim();
            return value ? proxyMedia(value) : "";
        },
        "",
    );
}
