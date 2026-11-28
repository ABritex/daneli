import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { JsonLd } from "@/components/seo/json-ld";
import { getWorkSlug, proxyMedia } from "@/features/works";
import { WorkPage } from "@/features/work-page";
import { getWorkBySlug, getWorks } from "@/lib/db-content";
import { createPageMetadata, siteConfig } from "@/lib/site";

// needs the param resolved before nav finishes for the morph
export const instant = false;

export async function generateStaticParams() {
    const works = await getWorks();
    const params = works.map((work) => ({ slug: getWorkSlug(work) })).filter((p) => p.slug);
    if (params.length > 0) return params;
    // Fallback so Cache Components build validation passes when DB has no works yet
    return [{ slug: "placeholder" }];
}

export async function generateMetadata({ params }: { params: Promise<{ slug: string }> }): Promise<Metadata> {
    const { slug } = await params;
    const work = await getWorkBySlug(slug);

    if (!work) {
        return {
            title: "Work Not Found",
            robots: { index: false, follow: false },
        };
    }

    return createPageMetadata({
        title: work.name,
        description: work.description,
        path: `/work/${slug}`,
        image: work.media ? proxyMedia(work.media) : siteConfig.ogImage,
        imageAlt: work.name,
        type: "article",
    });
}

export default async function Page({ params }: { params: Promise<{ slug: string }> }) {
    const { slug } = await params;
    if (slug === "placeholder") notFound();
    const [work, allWorks] = await Promise.all([getWorkBySlug(slug), getWorks()]);
    if (!work) notFound();
    const jsonLd = {
        "@context": "https://schema.org",
        "@type": "CreativeWork",
        name: work.name,
        description: work.description,
        image: work.media ? new URL(proxyMedia(work.media), siteConfig.url).toString() : undefined,
        url: new URL(`/work/${slug}`, siteConfig.url).toString(),
        author: {
            "@type": "Person",
            name: siteConfig.creator,
        },
    };

    return (
        <>
            <JsonLd data={jsonLd} />
            <WorkPage work={work} allWorks={allWorks} />
        </>
    );
}
