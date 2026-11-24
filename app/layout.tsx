import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import "./globals.css";
import { WorkTransitionProvider } from "@/features/works";
import { GrainOverlay, IntroSequence, Loader, SiteHeader, SmoothScroll, SpaceBackground } from "@/components/site";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: "DanEli",
  description: "DanEli — portfolio",
};

const BOOT = `(function(){var d=document.documentElement;var isHome=location.pathname==="/";d.dataset.loader=isHome?"playing":"skip";if(!isHome){d.dataset.intro="color";d.style.setProperty("--intro-hold","0ms");d.style.setProperty("--intro-shift","0ms");}try{history.scrollRestoration="manual"}catch(e){}try{if(location.hash){history.replaceState(null,"",location.pathname+location.search)}}catch(e){}try{window.scrollTo(0,0)}catch(e){}window.addEventListener("beforeunload",function(){try{window.scrollTo(0,0)}catch(e){}})})();`;

export default function RootLayout({ children }: Readonly<{ children: React.ReactNode }>) {
  return (
    <html
      lang="en"
      suppressHydrationWarning
      className={`${geistSans.variable} ${geistMono.variable} h-full antialiased`}
    >
      <head>
        <script dangerouslySetInnerHTML={{ __html: BOOT }} />
      </head>
      <body className="min-h-full flex flex-col">
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
