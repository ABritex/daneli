import type { Metadata } from "next";
import Link from "next/link";
import FuzzyText from "@/components/fuzzy-text";

export const metadata: Metadata = {
    title: "Not Found",
    robots: { index: false, follow: false },
};

export default function NotFound() {
    return (
        <main className="flex min-h-svh flex-col items-center justify-center gap-6 overflow-hidden bg-background px-6 text-center text-foreground">
            <FuzzyText
                fontSize="clamp(6rem, 18vw, 14rem)"
                fontWeight={900}
                color="currentColor"
                baseIntensity={0.12}
                hoverIntensity={0.45}
                fuzzRange={24}
                direction="horizontal"
                glitchMode
                glitchInterval={2600}
                glitchDuration={180}
                colorSplit={0.35}
                intro
                introDuration={900}
            >
                404
            </FuzzyText>
            <h1 className="font-screener text-sm uppercase tracking-[0.2em] text-foreground/60">Page not found</h1>
            <Link
                href="/"
                className="relative z-10 mt-2 inline-flex items-center gap-2 border border-foreground/40 px-5 py-3 font-screener text-sm uppercase tracking-[0.2em] text-foreground transition-colors hover:bg-foreground hover:text-background"
            >
                Back home
            </Link>
        </main>
    );
}
