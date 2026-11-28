"use client";

import { useEffect, useRef, useState } from "react";
import type { AnimationItem } from "lottie-web";
import { MQ_NARROW_768, mediaMatches } from "@/lib/media";
import { gsap } from "@/lib/gsap";

/*
 * Landing loader: Lottie intro -> D flies to the logo -> WELCOME flashbang -> ink drop.
 *
 *  1. black screen, the white DanEli wordmark sits dead centre and gets painted (daneli-intro.json)
 *  2. "anEli" folds away, only the D + brush is left
 *  3. the D flies to the header logo spot (top-left on desktop) while the screen stays black
 *  4. a white WELCOME snaps in on the black screen, same size and spot as the hero heading
 *  5. an ink drop grows out of the screen centre and reveals the real page; the loader WELCOME fades
 *     while the identical hero WELCOME shows through (the gaussian blur happens in the hero, not here)
 *  6. the real header logo fades in under the D, loader unmounts
 *
 * One Lottie instance only. It is drawn white with mix-blend-mode: difference, so it reads white on the
 * black screen and keeps reading inside the ink hole.
 * The black strokes baked into the file (the "border" around every shape) are stripped before playing.
 */

const LOTTIE_URL = "/daneli-intro.json";
const FPS = 24;
const END_FRAME = 120; // file runs to 204, but the D is settled by ~112; the rest is a slow zoom
const PLAY_SPEED = 1.3; // 1 = as designed
// Only this part of the 1920x1080 comp is ever drawn (wordmark + brush up to END_FRAME, plus margin).
const CROP = { x: 560, y: 360, w: 680, h: 360 };

// remove every stroke layer from the lottie data (the black 6px outline around each shape)
const stripStrokes = <T,>(node: T): T => {
    if (Array.isArray(node)) {
        return node.filter((n) => !(n && typeof n === "object" && (n as { ty?: unknown }).ty === "st")).map(stripStrokes) as unknown as T;
    }
    if (node && typeof node === "object") {
        const out: Record<string, unknown> = {};
        for (const [k, v] of Object.entries(node as Record<string, unknown>)) out[k] = stripStrokes(v);
        return out as T;
    }
    return node;
};

// measured from the file (px in the 1920x1080 composition)
// wordmark at the start: this point is put at the screen centre.
// It is the middle of the letters "DanEli" (not the brush tip / i-dot), so the word itself sits dead centre.
// Nudge CENTER_NUDGE if you want it a bit higher / lower / left / right (comp px, + = wordmark moves left/up).
const CENTER_NUDGE = { x: 54, y: 36 };
const WORD = { cx: 908.5 + CENTER_NUDGE.x, cy: 549.5 + CENTER_NUDGE.y, w: 545 };
// the D letter alone at END_FRAME (comp px), measured from the lottie. Used to land exactly on the header logo.
const LOGO_D = { cx: 992.5, cy: 577.2, h: 191 };
// the same D letter inside /daneli-word/daneli-logo-d.svg (viewBox 1384.67 x 1664.43)
const SVG_LOGO = { w: 1384.67, h: 1664.43, dcx: 969.75, dcy: 1140.85, dh: 1009.9 };

// ink drop (same feel as the old loader)
const GROW_MS = 1300; // circle: radius 0 -> full screen
const SNAP_AT_MS = 450; // when the real page starts fading in underneath
const SOFTNESS = 400; // max edge softness
const SOFTNESS_RAMP = 220; // radius (px) at which full softness is reached
const FX_HALO = true; // soft glow along the circle's edge
const FX_GRAIN = false; // film grain only shows on a light screen (it is multiplied), pointless on black

// 1) the D flies to the header logo while the screen is still black
const FLY_DELAY_MS = 150;
const FLY_MS = 1100;

// 2) white WELCOME: fades in sharp on the black screen, then fades out as the ink reveals the hero word underneath (no blur here, the blur lives in the hero)
const WORD_GAP_MS = 250; // black beat between the D landing and WELCOME
const WORD_IN_MS = 450;
const WELCOME_TEXT = "WELCOME";
// keep in sync with the <h1> in hero-section.tsx so the loader word sits exactly on the hero word
const WORD_FONT_SIZE = "clamp(2.6rem,14vw,17rem)";
const WORD_FADE_AT_MS = 600; // after the ink starts (the hole needs a moment to reach the letters)
const WORD_FADE_MS = 800;

// 3) ink drop starts this long after WELCOME starts snapping in
const INK_AFTER_WORD_MS = 700;

const HERO_MAX_WAIT_MS = 12000; // never keep people on the loader longer than this
const HERO_MAX_WAIT_MS_MOBILE = 6000;

const GRAIN_SVG =
    "<svg xmlns='http://www.w3.org/2000/svg' width='180' height='180'><filter id='n'><feTurbulence type='fractalNoise' baseFrequency='.85' numOctaves='2' stitchTiles='stitch'/><feColorMatrix values='0 0 0 0 0  0 0 0 0 0  0 0 0 0 0  0 0 0 .55 0'/></filter><rect width='100%' height='100%' filter='url(#n)'/></svg>";
const GRAIN_URL = `url("data:image/svg+xml,${encodeURIComponent(GRAIN_SVG)}")`;

const SCREEN = "#000000"; // loader background
const DARK = "#070707";
const FOREGROUND = "#e6e5e0";

export function Loader() {
    const [visible, setVisible] = useState(true);
    const coverRef = useRef<HTMLDivElement>(null);
    const haloRef = useRef<HTMLDivElement>(null);
    const grainRef = useRef<HTMLDivElement>(null);
    const boxRef = useRef<HTMLDivElement>(null);
    const flashRef = useRef<HTMLDivElement>(null);
    const flashTextRef = useRef<HTMLSpanElement>(null);
    const lottieRef = useRef<HTMLDivElement>(null);
    const countRef = useRef<HTMLSpanElement>(null);

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
        const halo = haloRef.current;
        const grain = grainRef.current;
        const box = boxRef.current;
        const flash = flashRef.current;
        const flashText = flashTextRef.current;
        const mount = lottieRef.current;
        if (!cover || !box || !mount || !flash || !flashText) return;

        const prevOverflow = document.body.style.overflow;
        document.body.style.overflow = "hidden";
        window.scrollTo(0, 0);

        let cancelled = false;
        let anim: AnimationItem | undefined;
        const timers: number[] = [];
        const tweens: gsap.core.Animation[] = [];

        const vw = window.innerWidth;
        const vh = window.innerHeight;
        const narrow = mediaMatches(MQ_NARROW_768);

        // put composition point (px, py) at screen point (sx, sy) at scale s (box is CROP-sized, origin top-left)
        const placement = (px: number, py: number, sx: number, sy: number, s: number) => ({ x: sx - (px - CROP.x) * s, y: sy - (py - CROP.y) * s, scale: s });

        // wordmark width on screen: ~42% of the viewport on desktop, 70% on phones. Dead centre, and it stays put.
        const s0 = Math.min(vw * (narrow ? 0.7 : 0.42), 640) / WORD.w;
        const start = placement(WORD.cx, WORD.cy, vw / 2, vh / 2, s0);
        gsap.set(box, { transformOrigin: "0 0", opacity: 0, ...start });
        gsap.set(flash, { opacity: 0 });

        // the ink drop grows out of the screen centre: that is where WELCOME is (flash + hero)
        const ox = vw / 2;
        const oy = vh / 2;
        const maxR = Math.hypot(Math.max(ox, vw - ox), Math.max(oy, vh - oy));

        // ---- ink drop helpers (cover has a hole cut into it) ---------------
        const setMask = (el: HTMLElement, value: string) => {
            el.style.setProperty("mask-image", value);
            el.style.setProperty("-webkit-mask-image", value);
        };
        const apply = (r: number) => {
            const t = Math.min(1, r / SOFTNESS_RAMP);
            const f = SOFTNESS * t * t * (3 - 2 * t); // smoothstep: 0 -> SOFTNESS
            const at = `circle at ${ox}px ${oy}px`;
            setMask(cover, `radial-gradient(${at}, transparent 0, transparent ${r}px, #000 ${r + f}px)`);
            if (FX_HALO && halo) {
                const a = 0.16 * (1 - Math.min(1, r / maxR));
                halo.style.opacity = "1";
                halo.style.background = `radial-gradient(${at}, transparent 0, transparent ${r * 0.9}px, rgba(255,255,255,${a}) ${r + f * 0.35}px, transparent ${r + f * 1.8}px)`;
            }
        };
        const jitterGrain = () => {
            if (grain) grain.style.backgroundPosition = `${Math.random() * 180}px ${Math.random() * 180}px`;
        };
        const ink = { r: 0 };
        const updateInk = () => {
            apply(ink.r);
            if (FX_GRAIN) jitterGrain();
        };

        // snap the palette underneath so the real page shows through the hole without a colour blink
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

        // ---- loading counter ------------------------------------------------
        const counter = { v: 0 };
        const setCount = (v: number) => {
            if (countRef.current) countRef.current.textContent = String(Math.round(v)).padStart(2, "0");
        };
        setCount(0);
        const countTween = gsap.to(counter, { v: 90, duration: END_FRAME / FPS / PLAY_SPEED + 1.2, ease: "power1.out", onUpdate: () => setCount(counter.v) });
        tweens.push(countTween);

        // ---- the hand-off: ink drop + D flies to the header logo ------------
        let logoLink: HTMLElement | null = null;
        const finish = () => {
            document.body.style.overflow = prevOverflow;
            if (logoLink) {
                logoLink.style.removeProperty("opacity"); // hand hover:opacity-100 back to the stylesheet
                logoLink.style.removeProperty("animation");
            }
            setVisible(false);
        };

        const play = () => {
            const logoEl = document.querySelector<HTMLElement>('[data-intro-logo], a[aria-label="Home"] > span');
            logoLink = logoEl?.closest<HTMLElement>("a") ?? null;
            const r = logoEl?.getBoundingClientRect();
            const hasTarget = !!r && r.width > 0 && !!logoLink;
            if (!hasTarget) console.warn("[loader] header logo not found, the D will just fade out");

            // keep the real logo hidden until the D lands on it (its own navIn animation has a delay)
            if (hasTarget && logoLink) {
                logoLink.style.animation = "none";
                logoLink.style.opacity = "0";
            }

            const tl = gsap.timeline({ onComplete: finish });
            tweens.push(tl);

            tl.to(countRef.current, { opacity: 0, duration: 0.25 }, 0);

            // timeline marks (seconds)
            const flyAt = FLY_DELAY_MS / 1000;
            const landAt = flyAt + FLY_MS / 1000;
            const wordAt = landAt + WORD_GAP_MS / 1000;
            const inkAt = wordAt + INK_AFTER_WORD_MS / 1000;
            const growS = GROW_MS / 1000;

            // 1) the D flies to the header logo over the black screen
            if (hasTarget && r && logoLink) {
                // line the lottie's D up with the D of the header logo (not the whole brush box)
                const k = r.height / SVG_LOGO.h; // screen px per svg unit
                const sF = (SVG_LOGO.dh * k) / LOGO_D.h;
                const target = placement(LOGO_D.cx, LOGO_D.cy, r.left + SVG_LOGO.dcx * k, r.top + SVG_LOGO.dcy * k, sF);
                tl.to(box, { ...target, opacity: 0.55, duration: FLY_MS / 1000, ease: "power3.inOut" }, flyAt);
            } else {
                tl.to(box, { opacity: 0, duration: 0.4, ease: "power1.out" }, flyAt);
            }

            // 2) white WELCOME fades in, same size as the hero heading (no scale change)
            tl.fromTo(flash, { opacity: 0 }, { opacity: 1, duration: WORD_IN_MS / 1000, ease: "power2.out" }, wordAt);

            // 3) ink drop from the centre; the loader word fades while the hero word shows through
            tl.to(flash, { opacity: 0, duration: WORD_FADE_MS / 1000, ease: "power1.in" }, inkAt + WORD_FADE_AT_MS / 1000);
            tl.call(() => apply(0), [], inkAt);
            tl.to(ink, { r: maxR, duration: growS, ease: "power2.in", onUpdate: updateInk }, inkAt);
            tl.call(() => snapPalette(false), [], inkAt + SNAP_AT_MS / 1000);
            tl.call(
                () => {
                    snapPalette(true); // data-loader = done: grid lines draw, nav pops in
                    document.body.style.overflow = prevOverflow;
                    window.dispatchEvent(new Event("daneli-loader-done"));
                    cover.style.display = "none";
                    flash.style.display = "none";
                    if (halo) halo.style.display = "none";
                },
                [],
                inkAt + growS,
            );

            // 4) hole reaches the corner: hand the D over to the real header logo
            if (hasTarget && logoLink) {
                const handAt = inkAt + growS * 0.9;
                tl.to(logoLink, { opacity: 0.55, duration: 0.25, ease: "none" }, handAt);
                tl.to(box, { opacity: 0, duration: 0.25, ease: "none" }, handAt);
            }
        };

        // ---- state machine --------------------------------------------------
        let animDone = false;
        let forced = false;
        let started = false;
        const heroReady = () => (window as unknown as { __heroReady?: boolean }).__heroReady === true;

        const tryStart = () => {
            if (started || !animDone || !(forced || heroReady())) return;
            started = true;
            window.removeEventListener("daneli-hero-ready", tryStart);
            countTween.kill();
            tweens.push(
                gsap.to(counter, {
                    v: 100,
                    duration: 0.35,
                    ease: "power2.out",
                    onUpdate: () => setCount(counter.v),
                    onComplete: () => {
                        if (!cancelled) play();
                    },
                }),
            );
        };
        window.addEventListener("daneli-hero-ready", tryStart);

        const heroMaxWait = narrow ? HERO_MAX_WAIT_MS_MOBILE : HERO_MAX_WAIT_MS;
        timers.push(
            window.setTimeout(() => {
                forced = true;
                tryStart();
            }, heroMaxWait),
        );

        // ---- start lottie ---------------------------------------------------
        const onFail = () => {
            if (cancelled) return;
            forced = true;
            animDone = true;
            tryStart();
        };
        const onAnimationDone = () => {
            if (cancelled || animDone) return;
            animDone = true;
            tryStart();
        };

        // fetch the json and the player in parallel (the file is small, the player is the slow part)
        const dataPromise = fetch(LOTTIE_URL).then((res) => (res.ok ? res.json() : Promise.reject(new Error("lottie json"))));
        void Promise.all([import("lottie-web"), dataPromise])
            .then(([{ default: lottie }, animationData]) => {
                if (cancelled) return;
                anim = lottie.loadAnimation({
                    container: mount,
                    renderer: "svg",
                    loop: false,
                    autoplay: false,
                    animationData: stripStrokes(animationData),
                    rendererSettings: {
                        preserveAspectRatio: "xMidYMid slice",
                        progressiveLoad: false,
                        viewBoxSize: `${CROP.x} ${CROP.y} ${CROP.w} ${CROP.h}`,
                    },
                });
                anim.setSpeed(PLAY_SPEED);

                let startedAnim = false;
                const startAnim = () => {
                    if (startedAnim || cancelled || !anim) return;
                    startedAnim = true;
                    gsap.set(box, { opacity: 1 });
                    anim.playSegments([0, END_FRAME], true);
                    // safety net in case "complete" never fires for a segment
                    timers.push(window.setTimeout(onAnimationDone, (END_FRAME / FPS / PLAY_SPEED) * 1000 + 1500));
                };
                // with animationData the DOM can already be built by now, so don't rely on the event alone
                if (anim.isLoaded) startAnim();
                else anim.addEventListener("DOMLoaded", startAnim);
                anim.addEventListener("complete", onAnimationDone);
                anim.addEventListener("data_failed", onFail);
            })
            .catch(onFail);

        return () => {
            cancelled = true;
            window.removeEventListener("daneli-hero-ready", tryStart);
            tweens.forEach((t) => t.kill());
            timers.forEach((t) => window.clearTimeout(t));
            anim?.destroy();
            document.body.style.overflow = prevOverflow;
            root.style.removeProperty("--background");
            root.style.removeProperty("--foreground");
        };
    }, []);

    if (!visible) return null;

    return (
        <div id="daneli-loader" aria-hidden="true" style={{ position: "fixed", inset: 0, zIndex: 100000, pointerEvents: "none" }}>
            {/* black screen; the ink drop cuts a hole out of it */}
            <div ref={coverRef} style={{ position: "absolute", inset: 0, background: SCREEN, willChange: "mask-image" }}>
                {FX_GRAIN && <div ref={grainRef} style={{ position: "absolute", inset: 0, backgroundImage: GRAIN_URL, opacity: 0.22, mixBlendMode: "multiply" }} />}
            </div>

            {/* soft glow along the circle's edge */}
            {FX_HALO && <div ref={haloRef} style={{ position: "absolute", inset: 0, opacity: 0 }} />}

            {/* white WELCOME, centred like the hero heading. sits above the cover, below the D */}
            <div ref={flashRef} style={{ position: "absolute", inset: 0, opacity: 0, display: "flex", alignItems: "center", justifyContent: "center", willChange: "opacity" }}>
                <span
                    ref={flashTextRef}
                    className="font-monument font-extrabold uppercase leading-none"
                    style={{ color: FOREGROUND, fontSize: WORD_FONT_SIZE, textAlign: "center", willChange: "opacity" }}
                >
                    {WELCOME_TEXT}
                </span>
            </div>

            {/* the lottie is drawn white + difference: white on the black screen and inside the hole.
                Only the CROP region of the comp is drawn; the box is moved / scaled with transforms (all vector). */}
            <div ref={boxRef} style={{ position: "absolute", left: 0, top: 0, width: CROP.w, height: CROP.h, opacity: 0, mixBlendMode: "difference", willChange: "transform, opacity" }}>
                <div ref={lottieRef} style={{ width: "100%", height: "100%" }} />
            </div>

            <span
                ref={countRef}
                className="font-screener text-[10px] uppercase tracking-[0.32em]"
                style={{ position: "absolute", bottom: 40, left: "50%", transform: "translateX(-50%)", color: "#fff", mixBlendMode: "difference" }}
            >
                00
            </span>
        </div>
    );
}
