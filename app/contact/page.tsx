import type { Metadata } from "next";
import { ContactPage } from "@/features/contact-page";
import { createPageMetadata, siteConfig } from "@/lib/site";

export const metadata: Metadata = createPageMetadata({
  title: "Contact",
  description: `Get in touch with ${siteConfig.creator} for cinematography, 3D motion, VFX, and creative collaborations.`,
  path: "/contact",
  imageAlt: `Contact ${siteConfig.name}`,
  imageWidth: 1200,
  imageHeight: 630,
  socialDescription: `Get in touch with ${siteConfig.creator} for creative collaborations.`,
});

export default function Page() {
  return <ContactPage />;
}
