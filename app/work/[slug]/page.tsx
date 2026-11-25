import type { Metadata } from "next";
import { getWorkBySlug, getWorkSlug, works } from "@/features/works";
import { WorkPage } from "@/features/work-page";
import { createPageMetadata, siteConfig } from "@/lib/site";

// needs the param resolved before nav finishes for the morph
export const instant = false;

export const generateStaticParams = () => {
  return works.map((work) => ({ slug: getWorkSlug(work) }));
};

export async function generateMetadata({
  params,
}: {
  params: Promise<{ slug: string }>;
}): Promise<Metadata> {
  const { slug } = await params;
  const work = getWorkBySlug(slug);

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
    image: work.media || siteConfig.ogImage,
    imageAlt: work.name,
    type: "article",
  });
}

export default async function Page({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;
  const work = getWorkBySlug(slug);
  return <WorkPage work={work} />;
}
