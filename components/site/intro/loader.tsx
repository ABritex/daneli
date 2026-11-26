"use client";

import { useEffect, useRef, useState } from "react";
import { MQ_NARROW_768, mediaMatches } from "@/lib/media";
import { gsap } from "@/lib/gsap";

// landing loader, does the ink drop reveal thing on the home page

const HOLD_MS = 700; // minimum time the light screen holds before the dot can appear
const HERO_MAX_WAIT_MS = 12000; // never keep people on the loader longer than this, even if the model is slow
const HERO_MAX_WAIT_MS_MOBILE = 6000;
const GROW_MS = 1300; // one continuous growth: scale 0 -> full screen
const SNAP_AT_MS = 450; // when the real page starts fading in underneath
const ORIGIN_X = 0.5; // fraction of viewport width
const ORIGIN_Y = 0.58; // fraction of viewport height (just under the word's centre)

// edge softness, ramps in so it doesn't pop
const SOFTNESS = 400; // max edge softness
const SOFTNESS_RAMP = 220; // radius (px) at which the full softness is reached

// FX toggles
const FX_HALO = true; // soft glow along the circle's edge
const FX_GRAIN = true; // flickering film grain on the light screen

const GRAIN_SVG =
    "<svg xmlns='http://www.w3.org/2000/svg' width='180' height='180'><filter id='n'><feTurbulence type='fractalNoise' baseFrequency='.85' numOctaves='2' stitchTiles='stitch'/><feColorMatrix values='0 0 0 0 0  0 0 0 0 0  0 0 0 0 0  0 0 0 .55 0'/></filter><rect width='100%' height='100%' filter='url(#n)'/></svg>";
const GRAIN_URL = `url("data:image/svg+xml,${encodeURIComponent(GRAIN_SVG)}")`;

const LIGHT = "#e6e5e0";
const DARK = "#070707";
const FOREGROUND = "#e6e5e0";

export function Loader() {
    const [visible, setVisible] = useState(true);
    const coverRef = useRef<HTMLDivElement>(null);
    const inkRef = useRef<HTMLDivElement>(null);
    const haloRef = useRef<HTMLDivElement>(null);
    const grainRef = useRef<HTMLDivElement>(null);
    const countCoverRef = useRef<HTMLSpanElement>(null);
    const countInkRef = useRef<HTMLSpanElement>(null);

    useEffect(() => {
        const root = document.documentElement;
        try {
            if (root.dataset.loader === "skip") {
                window.dispatchEvent(new Event("daneli-loader-done"));
                // eslint-disable-next-line react-hooks/set-state-in-effect
                setVisible(false);
                return;
            }
            root.dataset.loader = "playing";
        } catch {
            // keep loader visible
        }

        const cover = coverRef.current;
        const ink = inkRef.current;
        const halo = haloRef.current;
        const grain = grainRef.current;
        if (!cover || !ink) return;

        const prevOverflow = document.body.style.overflow;
        document.body.style.overflow = "hidden";
        window.scrollTo(0, 0);

        const w = window.innerWidth;
        const h = window.innerHeight;
        const ox = w * ORIGIN_X;
        const oy = h * ORIGIN_Y;
        // radius needed to cover the whole screen
        const maxR = Math.hypot(Math.max(ox, w - ox), Math.max(oy, h - oy));

        const setMask = (el: HTMLElement, value: string) => {
            el.style.setProperty("mask-image", value);
            el.style.setProperty("-webkit-mask-image", value);
        };

        // r = hole radius, feather grows with it
        const apply = (r: number) => {
            const t = Math.min(1, r / SOFTNESS_RAMP);
            const f = SOFTNESS * t * t * (3 - 2 * t); // smoothstep: 0 -> SOFTNESS
            const at = `circle at ${ox}px ${oy}px`;
            setMask(cover, `radial-gradient(${at}, transparent 0, transparent ${r}px, #000 ${r + f}px)`);
            setMask(ink, `radial-gradient(${at}, #000 0, #000 ${r}px, transparent ${r + f}px)`);
            if (FX_HALO && halo) {
                // glow on the edge, fades out as it grows
                const a = 0.16 * (1 - Math.min(1, r / maxR));
                halo.style.opacity = "1";
                halo.style.background = `radial-gradient(${at}, transparent 0, transparent ${r * 0.9}px, rgba(255,255,255,${a}) ${r + f * 0.35}px, transparent ${r + f * 1.8}px)`;
            }
        };

        // flicker grain by moving it around
        const jitterGrain = () => {
            if (grain) grain.style.backgroundPosition = `${Math.random() * 180}px ${Math.random() * 180}px`;
        };

        const timers: number[] = [];
        // keep loader word up until hero word finishes fading in
        const shiftMs = parseFloat(getComputedStyle(root).getPropertyValue("--intro-shift")) || 1500;

        // snap palette underneath, no transition blink
        const snapPalette = (finish: boolean) => {
            try {
                const prevTransition = root.style.transition;
                root.style.transition = "none";
                root.style.setProperty("--background", DARK);
                root.style.setProperty("--foreground", FOREGROUND);
                root.dataset.intro = "color";
                if (finish) {
                    root.dataset.loader = "done";
                    root.style.removeProperty("--background");
                    root.style.removeProperty("--foreground");
                }
                root.getBoundingClientRect(); // flush
                root.style.transition = prevTransition;
            } catch {}
        };

        const state = { r: 0 };
        const update = () => {
            apply(state.r);
            if (FX_GRAIN) jitterGrain();
        };

        // wait for hold + hero ready, then start
        const counter = { v: 0 };
        const setCount = (v: number) => {
            const t = String(Math.round(v)).padStart(2, "0");
            if (countCoverRef.current) countCoverRef.current.textContent = t;
            if (countInkRef.current) countInkRef.current.textContent = t;
        };
        setCount(0);
        const countTween = gsap.to(counter, {
            v: 90,
            duration: 8,
            ease: "power1.out",
            onUpdate: () => setCount(counter.v),
        });

        const tl = gsap.timeline({ paused: true });
        let holdDone = false;
        let forced = false;
        let started = false;
        const heroReady = () => (window as unknown as { __heroReady?: boolean }).__heroReady === true;
        const tryStart = () => {
            if (started || !holdDone || !(forced || heroReady())) return;
            started = true;
            countTween.kill();
            gsap.to(counter, { v: 100, duration: 0.35, ease: "power2.out", onUpdate: () => setCount(counter.v) });
            window.removeEventListener("daneli-hero-ready", tryStart);
            tl.play();
        };
        window.addEventListener("daneli-hero-ready", tryStart);
        const heroMaxWait = mediaMatches(MQ_NARROW_768) ? HERO_MAX_WAIT_MS_MOBILE : HERO_MAX_WAIT_MS;
        timers.push(
            window.setTimeout(() => {
                holdDone = true;
                tryStart();
            }, HOLD_MS),
        );
        timers.push(
            window.setTimeout(() => {
                holdDone = true;
                forced = true;
                tryStart();
            }, heroMaxWait),
        );

        // grow the hole out
        tl.call(() => {
            ink.style.opacity = "1";
            apply(0);
        });
        const growAt = ">";
        tl.to(
            state,
            {
                r: maxR,
                duration: GROW_MS / 1000,
                ease: "power2.in",
                onUpdate: update,
            },
            growAt,
        );

        // start showing the real page underneath
        tl.call(() => snapPalette(false), [], `<+=${SNAP_AT_MS / 1000}`);

        // hand off to the real page
        tl.call(() => {
            snapPalette(true);
            document.body.style.overflow = prevOverflow;
            window.dispatchEvent(new Event("daneli-loader-done"));
            // light screen done, just keep the word for a beat
            cover.style.display = "none";
            if (halo) halo.style.display = "none";
            const remaining = Math.max(180, shiftMs - (GROW_MS - SNAP_AT_MS) + 60);
            timers.push(window.setTimeout(() => setVisible(false), remaining));
        });

        return () => {
            window.removeEventListener("daneli-hero-ready", tryStart);
            countTween.kill();
            tl.kill();
            timers.forEach((t) => window.clearTimeout(t));
            document.body.style.overflow = prevOverflow;
            root.style.removeProperty("--background");
            root.style.removeProperty("--foreground");
        };
    }, []);

    if (!visible) return null;

    const wordClass = "font-monument text-[clamp(3.4rem,18vw,22rem)] font-extrabold uppercase leading-none select-none";
    const centre: React.CSSProperties = {
        position: "absolute",
        inset: 0,
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
    };

    return (
        <div
            id="daneli-loader"
            aria-hidden="true"
            style={{
                position: "fixed",
                inset: 0,
                zIndex: 100000,
                pointerEvents: "none",
            }}
        >
            {/* light screen + dark word; a hole is cut out of it */}
            <div ref={coverRef} style={{ ...centre, background: LIGHT, color: DARK, willChange: "mask-image" }}>
                {FX_GRAIN && (
                    <div
                        ref={grainRef}
                        style={{
                            position: "absolute",
                            inset: 0,
                            backgroundImage: GRAIN_URL,
                            opacity: 0.22,
                            mixBlendMode: "multiply",
                        }}
                    />
                )}
                <div className={wordClass} style={{ position: "relative" }}>
                    DANELI
                </div>
                <span ref={countCoverRef} className="font-screener text-[10px] uppercase tracking-[0.32em]" style={{ position: "absolute", bottom: 40, left: "50%", transform: "translateX(-50%)" }}>
                    00
                </span>
            </div>

            {/* light word, visible only inside the hole */}
            <div ref={inkRef} style={{ ...centre, color: FOREGROUND, opacity: 0, willChange: "mask-image" }}>
                <div className={wordClass}>DANELI</div>
                <span ref={countInkRef} className="font-screener text-[10px] uppercase tracking-[0.32em]" style={{ position: "absolute", bottom: 40, left: "50%", transform: "translateX(-50%)" }}>
                    00
                </span>
            </div>

            {/* soft glow along the circle's edge */}
            {FX_HALO && <div ref={haloRef} style={{ position: "absolute", inset: 0, opacity: 0 }} />}
        </div>
    );
}
