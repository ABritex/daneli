import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import "./globals.css";
import { WorkTransitionProvider } from "@/features/works";
import { GrainOverlay, IntroSequence, Loader, SiteHeader, SmoothScroll } from "@/components/site";

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

// Boot the loader and force top-of-page on refresh.
const BOOT = `(function(){var d=document.documentElement;d.dataset.loader="playing";try{history.scrollRestoration="manual"}catch(e){}try{if(location.hash){history.replaceState(null,"",location.pathname+location.search)}}catch(e){}try{window.scrollTo(0,0)}catch(e){}window.addEventListener("beforeunload",function(){try{window.scrollTo(0,0)}catch(e){}})})();`;

export default function RootLayout({ children }: Readonly<{ children: React.ReactNode }>) {
  return (
    <html
      lang="en"
      suppressHydrationWarning
      className={`${geistSans.variable} ${geistMono.variable} h-full antialiased`}
    >
      <head>
        {/* inline (not next/script) so the state is set before first paint */}
        <script dangerouslySetInnerHTML={{ __html: BOOT }} />
      </head>
      <body className="min-h-full flex flex-col">
        <SmoothScroll>
          <WorkTransitionProvider>
            <Loader />
            <GrainOverlay />
            <IntroSequence />
            <SiteHeader />
            {children}
          </WorkTransitionProvider>
        </SmoothScroll>
      </body>
    </html>
  );
}
