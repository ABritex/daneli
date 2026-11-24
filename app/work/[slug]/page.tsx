import { works } from "@/features/works";
import { WorkPage } from "@/features/work-page";

// needs the param resolved before nav finishes for the morph
export const instant = false;

export const generateStaticParams = () => {
  return works.map((w) => ({ slug: w.href?.replace("/work/", "") ?? "" }));
};

export default async function Page({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;
  const work = works.find((w) => w.href === `/work/${slug}`);
  return <WorkPage work={work} />;
}
