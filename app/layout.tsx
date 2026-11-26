import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import "./globals.css";
import { WorkTransitionProvider } from "@/features/works";
import { ConsoleEasterEgg, GrainOverlay, IntroSequence, Loader, SiteHeader, SmoothScroll, SpaceBackground } from "@/components/site";
import { JsonLd } from "@/components/seo/json-ld";
import { siteConfig } from "@/lib/site";

const geistSans = Geist({
    variable: "--font-geist-sans",
    subsets: ["latin"],
});

const geistMono = Geist_Mono({
    variable: "--font-geist-mono",
    subsets: ["latin"],
});

export const metadata: Metadata = {
    metadataBase: new URL(siteConfig.url),
    title: {
        default: siteConfig.title,
        template: `%s | ${siteConfig.name}`,
    },
    description: siteConfig.description,
    applicationName: siteConfig.name,
    creator: siteConfig.creator,
    publisher: siteConfig.creator,
    alternates: {
        canonical: "/",
    },
    openGraph: {
        type: "website",
        locale: "en_US",
        url: siteConfig.url,
        siteName: siteConfig.name,
        title: siteConfig.title,
        description: siteConfig.description,
        images: [
            {
                url: siteConfig.ogImage,
                width: 1200,
                height: 630,
                alt: `${siteConfig.name} portfolio`,
            },
        ],
    },
    twitter: {
        card: "summary_large_image",
        title: siteConfig.title,
        description: siteConfig.description,
        images: [siteConfig.ogImage],
    },
    robots: {
        index: true,
        follow: true,
        googleBot: {
            index: true,
            follow: true,
            "max-image-preview": "large",
            "max-snippet": -1,
            "max-video-preview": -1,
        },
    },
};

const BOOT = `(function(){var d=document.documentElement;var isHome=location.pathname==="/";d.dataset.loader=isHome?"playing":"skip";if(!isHome){d.dataset.intro="color";d.style.setProperty("--intro-hold","0ms");d.style.setProperty("--intro-shift","0ms");}try{history.scrollRestoration="manual"}catch(e){}try{if(location.hash){history.replaceState(null,"",location.pathname+location.search)}}catch(e){}try{window.scrollTo(0,0)}catch(e){}window.addEventListener("beforeunload",function(){try{window.scrollTo(0,0)}catch(e){}})})();`;

export default function RootLayout({ children }: Readonly<{ children: React.ReactNode }>) {
    const websiteJsonLd = {
        "@context": "https://schema.org",
        "@type": "WebSite",
        name: siteConfig.name,
        url: siteConfig.url,
        description: siteConfig.description,
    };

    const personJsonLd = {
        "@context": "https://schema.org",
        "@type": "Person",
        name: siteConfig.creator,
        url: siteConfig.url,
        email: siteConfig.email,
        jobTitle: "Creative Director & Visual Designer",
    };

    return (
        <html lang="en" suppressHydrationWarning className={`${geistSans.variable} ${geistMono.variable} h-full antialiased`}>
            <head>
                <script dangerouslySetInnerHTML={{ __html: BOOT }} />
            </head>
            <body className="min-h-full flex flex-col">
                <JsonLd data={[websiteJsonLd, personJsonLd]} />
                <ConsoleEasterEgg />
                <SmoothScroll>
                    <WorkTransitionProvider>
                        <SpaceBackground />
                        <Loader />
                        <GrainOverlay />
                        <IntroSequence />
                        <SiteHeader />
                        <div className="relative z-[1]">{children}</div>
                    </WorkTransitionProvider>
                </SmoothScroll>
            </body>
        </html>
    );
}
