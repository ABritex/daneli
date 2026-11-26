import type { Metadata } from "next";

export const siteConfig = {
    name: "DanEli",
    title: "DanEli — Creative Director & Visual Designer",
    description: "Portfolio of Daniel Eli Reyes, a creative generalist specializing in cinematography, 3D motion, VFX, and visual storytelling.",
    url: process.env.NEXT_PUBLIC_SITE_URL ?? "https://dan-eli.vercel.app",
    ogImage: "/opengraph-image",
    creator: "Daniel Eli Reyes",
    email: "danelidevr@gmail.com",
} as const;

export const absoluteUrl = (path: string) => new URL(path, siteConfig.url).toString();

type PageMetadataOptions = {
    title: string;
    description: string;
    path: string;
    image?: string;
    imageAlt?: string;
    imageWidth?: number;
    imageHeight?: number;
    socialDescription?: string;
    type?: "website" | "article";
};

export function createPageMetadata({
    title,
    description,
    path,
    image = siteConfig.ogImage,
    imageAlt = `${siteConfig.name} portfolio`,
    imageWidth,
    imageHeight,
    socialDescription = description,
    type,
}: PageMetadataOptions): Metadata {
    const socialTitle = `${title} | ${siteConfig.name}`;
    const imageEntry = {
        url: image,
        alt: imageAlt,
        ...(imageWidth ? { width: imageWidth } : {}),
        ...(imageHeight ? { height: imageHeight } : {}),
    };

    return {
        title,
        description,
        alternates: {
            canonical: path,
        },
        openGraph: {
            ...(type ? { type } : {}),
            title: socialTitle,
            description: socialDescription,
            url: path,
            images: [imageEntry],
        },
        twitter: {
            card: "summary_large_image",
            title: socialTitle,
            description: socialDescription,
            images: [image],
        },
    };
}
