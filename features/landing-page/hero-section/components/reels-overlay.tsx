import type { CSSProperties } from "react";

/* edit the words here */
const HEADING = ["Selected", "reels"];
const LABEL = "(02) Showreel";
const COPY = "Lorem ipsum dolor sit amet, consectetur adipiscing elit, sed do eiusmod tempor incididunt ut labore et dolore magna aliqua.";
const TICKER = ["3D Design", "Motion Graphics", "Visual Effects", "Cinematography", "Videography"];

/** the slice of the reels fade (0..1) an element animates in. later slice = later entrance, earlier exit */
const range = (a: number, b: number) => ({ "--a": a, "--b": b }) as CSSProperties;

const META = "font-screener text-[10px] uppercase tracking-[0.32em] text-foreground/50";

/**
 * Everything on the reels stage except the wall and the video itself.
 * No state, no effects: every animation reads the --reels number that use-hero-section writes on the stage.
 */
export function ReelsOverlay() {
    return (
        <div className="reels-overlay">
            {/* top row */}
            <div className={`absolute inset-x-0 top-0 flex items-start justify-between px-8 pt-6 md:px-12 ${META}`}>
                <span className="reels-rv reels-rise flex items-center gap-3" style={range(0.1, 0.5)}>
                    Scroll to drift
                    <svg viewBox="0 0 12 12" fill="none" stroke="currentColor" strokeWidth="1" className="animate-scroll-v size-3" aria-hidden="true">
                        <path d="M6 1v10M2 7l4 4 4-4" />
                    </svg>
                </span>
                <span className="reels-rv reels-rise" style={range(0.2, 0.6)}>
                    Loop / 15
                </span>
            </div>

            {/* same box as the video frame, so the extras line up with it */}
            <div className="absolute inset-0 flex items-center justify-center px-6">
                <div className="relative aspect-video w-[min(72vw,960px)]">
                    <div className="reels-rv reels-brackets" style={range(0.3, 0.9)} aria-hidden="true">
                        <i />
                        <i />
                        <i />
                        <i />
                    </div>

                    <div className="reels-rv reels-rise reels-above" style={range(0.45, 0.85)}>
                        <span className="flex items-center">
                            <b className="reels-dot" />
                            Showreel 2026
                        </span>
                        <span>16:9 / HD</span>
                    </div>

                    <div className="reels-rv reels-rise reels-below" style={range(0.55, 0.95)} aria-hidden="true">
                        <div className="reels-ticker">
                            <div className="reels-track">
                                {[0, 1].map((g) => (
                                    <span key={g} className="reels-group">
                                        {TICKER.map((t) => (
                                            <span key={t}>
                                                {t}
                                                <em>/</em>
                                            </span>
                                        ))}
                                    </span>
                                ))}
                            </div>
                        </div>
                    </div>
                </div>
            </div>

            {/* bottom row: heading left, copy right (stacked on phones) */}
            <div className="absolute inset-x-0 bottom-0 flex flex-col gap-4 px-8 pb-6 md:flex-row md:items-end md:justify-between md:gap-12 md:px-12">
                <h2 id="reels-heading" className="font-screener text-[clamp(1.6rem,4vw,3.4rem)] font-extrabold leading-none tracking-[-0.04em] text-foreground mix-blend-difference">
                    {HEADING.map((w, i) => (
                        <span key={w} className="reels-mask">
                            <span className="reels-rv reels-mask-in" style={range(0.15 + i * 0.12, 0.6 + i * 0.12)}>
                                {w}
                                {i < HEADING.length - 1 ? "\u00A0" : ""}
                            </span>
                        </span>
                    ))}
                </h2>

                <div className="max-w-[34ch]">
                    <p className={`reels-rv reels-rise ${META}`} style={range(0.5, 0.85)}>
                        {LABEL}
                    </p>
                    <p className="reels-rv reels-blur-in mt-3 text-sm leading-relaxed text-foreground/70 [text-shadow:0_1px_14px_rgb(0_0_0/0.7)]" style={range(0.6, 1)}>
                        {COPY}
                    </p>
                </div>
            </div>
        </div>
    );
}
