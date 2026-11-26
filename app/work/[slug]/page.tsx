import type { Metadata } from "next";
import { JsonLd } from "@/components/seo/json-ld";
import { getWorkSlug, proxyMedia } from "@/features/works";
import { WorkPage } from "@/features/work-page";
import { getWorkBySlug, getWorks } from "@/lib/db-content";
import { createPageMetadata, siteConfig } from "@/lib/site";

// needs the param resolved before nav finishes for the morph
export const instant = false;

export async function generateStaticParams() {
    const works = await getWorks();
    return works.map((work) => ({ slug: getWorkSlug(work) }));
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
    const [work, allWorks] = await Promise.all([getWorkBySlug(slug), getWorks()]);
    const jsonLd = work
        ? {
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
          }
        : null;

    return (
        <>
            {jsonLd ? <JsonLd data={jsonLd} /> : null}
            <WorkPage work={work} allWorks={allWorks} />
        </>
    );
}
