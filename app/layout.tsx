import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import "./globals.css";
import { WorkTransitionProvider } from "@/features/works";
import {
  DraftingCursor,
  GridReplay,
  IntroSequence,
  SiteFooter,
  SiteHeader,
  SmoothScroll,
} from "@/components/site";

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

// The intro loader is disabled (its component is not mounted), so the page
// boots with data-loader="skip" and the grid lines / nav / colour fade still
// play. Set data-loader="playing" again to bring the brush loader back.
const BOOT = `(function(){var d=document.documentElement;d.dataset.loader="skip";try{history.scrollRestoration="manual"}catch(e){}})();`;

export default function RootLayout({ children }: LayoutProps<"/">) {
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
            <IntroSequence />
            <GridReplay />
            <SiteHeader />
            <DraftingCursor />
            {children}
            <SiteFooter />
          </WorkTransitionProvider>
        </SmoothScroll>
      </body>
    </html>
  );
}
