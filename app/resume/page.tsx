import type { Metadata } from "next";
import { ResumePage } from "@/features/resume-page";
import { createPageMetadata, siteConfig } from "@/lib/site";

export const metadata: Metadata = createPageMetadata({
  title: "Resume",
  description: `Experience, skills, and education of ${siteConfig.creator} — creative generalist in cinematography, 3D motion, and visual design.`,
  path: "/resume",
  imageAlt: `${siteConfig.name} resume`,
  imageWidth: 1200,
  imageHeight: 630,
  socialDescription: `Experience, skills, and education of ${siteConfig.creator}.`,
});

export default function Page() {
  return <ResumePage />;
}
