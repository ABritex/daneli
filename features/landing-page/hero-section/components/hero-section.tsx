"use client";

import { ChevronsDown } from "lucide-react";
import { useRef } from "react";
import { EXIT_BAND, HERO_MARKER_VH, STAGE_VH, VIGNETTE } from "../config/config";
import { ReelsVideo } from "./reels-video";
import { ReelsOverlay } from "./reels-overlay";
import { useHeroScene } from "../hooks/use-hero-scene";

export function HeroSection({ art, artMobile, reelVideoUrl }: { art: string[]; artMobile: string[]; reelVideoUrl?: string }) {
    const canvasRef = useRef<HTMLCanvasElement>(null);
    const stageRef = useRef<HTMLDivElement>(null);
    const wrapperRef = useRef<HTMLDivElement>(null);
    const heroOverlayRef = useRef<HTMLDivElement>(null);
    const heroMetaRef = useRef<HTMLDivElement>(null);
    const reelsHeadingRef = useRef<HTMLDivElement>(null);
    const reelsMetaRef = useRef<HTMLDivElement>(null);
    const reelsVideoRef = useRef<HTMLDivElement>(null);
    const vignetteRef = useRef<HTMLDivElement>(null);
    const exitRef = useRef<HTMLDivElement>(null);

    useHeroScene({
        canvasRef,
        stageRef,
        wrapperRef,
        heroOverlayRef,
        heroMetaRef,
        reelsHeadingRef,
        reelsMetaRef,
        reelsVideoRef,
        vignetteRef,
        exitRef,
        art,
        artMobile,
    });

    return (
        <div ref={wrapperRef} className="relative" style={{ height: `${STAGE_VH}vh` }}>
            <div ref={stageRef} className="sticky top-0 h-screen overflow-hidden">
                <div ref={heroOverlayRef} className="pointer-events-none relative z-0 flex h-full items-center justify-center px-6 text-center will-change-[transform,opacity]">
                    <h1 id="hero-heading" className="font-monument text-[clamp(3.4rem,18vw,22rem)] font-extrabold uppercase leading-none text-foreground opacity-100">
                        DANELI
                    </h1>
                </div>
                <canvas ref={canvasRef} className="absolute inset-0 z-[1] block h-full w-full" aria-hidden="true" />
                <div
                    className="pointer-events-none absolute inset-0 z-[4]"
                    style={{
                        background: "linear-gradient(to bottom, var(--background) 0%, transparent 22%, transparent 78%, var(--background) 100%)",
                    }}
                    aria-hidden="true"
                />
                <div ref={vignetteRef} className="pointer-events-none absolute inset-0 z-[5]" style={{ background: VIGNETTE, opacity: 0, willChange: "opacity" }} aria-hidden="true" />
                {/* exit dissolve: a soft-edged slab that sits just below the stage and rises with transform */}
                <div
                    ref={exitRef}
                    className="pointer-events-none absolute inset-x-0 z-[5]"
                    style={{
                        top: "100%",
                        height: `${(1 + EXIT_BAND) * 100}%`,
                        background: `linear-gradient(to bottom, transparent 0%, var(--background) ${((EXIT_BAND / (1 + EXIT_BAND)) * 100).toFixed(3)}%)`,
                        willChange: "transform",
                    }}
                    aria-hidden="true"
                />

                <ReelsVideo frameRef={reelsVideoRef} url={reelVideoUrl} />

                <div
                    ref={heroMetaRef}
                    className="pointer-events-none absolute inset-x-0 bottom-0 z-20 flex items-end justify-between px-8 pb-6 font-screener text-[10px] uppercase tracking-[0.32em] text-foreground/50 md:px-12"
                >
                    <span>01 / Hero</span>
                    <span className="inline-flex items-center gap-3 text-xs sm:text-sm">
                        Scroll more to explore
                        <ChevronsDown className="size-5 sm:size-6 animate-scroll-v" aria-hidden="true" />
                    </span>
                </div>

                <ReelsOverlay />
            </div>

            {/* two semantic sections share the pinned stage; the split marks where
          the spiral hands off to the drift wall */}
            <section id="hero" aria-labelledby="hero-heading" className="pointer-events-none absolute inset-x-0 top-0" style={{ height: `${HERO_MARKER_VH}vh` }} />
            <section id="reels" aria-labelledby="reels-heading" className="pointer-events-none absolute inset-x-0 bottom-0" style={{ top: `${HERO_MARKER_VH}vh` }} />
        </div>
    );
}
