"use client";

import { useEffect, useRef, useState } from "react";
import { gsap } from "gsap";

// landing loader, does the ink drop reveal thing on the home page

const HOLD_MS = 700;        // minimum time the light screen holds before the dot can appear
const HERO_MAX_WAIT_MS = 12000; // never keep people on the loader longer than this, even if the model is slow
const GROW_MS = 1300;       // one continuous growth: scale 0 -> full screen
const SNAP_AT_MS = 450;     // when the real page starts fading in underneath
const ORIGIN_X = 0.5;       // fraction of viewport width
const ORIGIN_Y = 0.58;      // fraction of viewport height (just under the word's centre)

// Softness (feather) of the edge, in px. Eases in from 0 so the dot is born
// from nothing instead of popping in as a blur.
const SOFTNESS = 400;       // max edge softness
const SOFTNESS_RAMP = 220;  // radius (px) at which the full softness is reached

// FX toggles
const FX_HALO = true;       // soft glow along the circle's edge
const FX_GRAIN = true;      // flickering film grain on the light screen

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
    // distance to the farthest corner = radius needed to clear the screen
    const maxR = Math.hypot(Math.max(ox, w - ox), Math.max(oy, h - oy));

    const setMask = (el: HTMLElement, value: string) => {
      el.style.setProperty("mask-image", value);
      el.style.setProperty("-webkit-mask-image", value);
    };

    // r = radius of the fully-open hole, feather grows with size
    const apply = (r: number) => {
      const t = Math.min(1, r / SOFTNESS_RAMP);
      const f = SOFTNESS * t * t * (3 - 2 * t); // smoothstep: 0 -> SOFTNESS
      const at = `circle at ${ox}px ${oy}px`;
      setMask(cover, `radial-gradient(${at}, transparent 0, transparent ${r}px, #000 ${r + f}px)`);
      setMask(ink, `radial-gradient(${at}, #000 0, #000 ${r}px, transparent ${r + f}px)`);
      if (FX_HALO && halo) {
        // glow sits on the revealed side of the edge, fades as the circle leaves the screen
        const a = 0.16 * (1 - Math.min(1, r / maxR));
        halo.style.opacity = "1";
        halo.style.background = `radial-gradient(${at}, transparent 0, transparent ${r * 0.9}px, rgba(255,255,255,${a}) ${r + f * 0.35}px, transparent ${r + f * 1.8}px)`;
      }
    };

    // grain flickers by hopping its tile around
    const jitterGrain = () => {
      if (grain) grain.style.backgroundPosition = `${Math.random() * 180}px ${Math.random() * 180}px`;
    };

    const timers: number[] = [];
    // the hero word fades in over --intro-shift (starts at SNAP_AT_MS);
    // keep the loader word on top until that's done so the swap is invisible
    const shiftMs = parseFloat(getComputedStyle(root).getPropertyValue("--intro-shift")) || 1500;

    // snap the page underneath to the real palette (no transition, no black blink)
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

    /* paused: it only starts once the minimum hold has passed AND the hero reports it is ready
       (model + textures loaded, GPU warmed). slow PCs just see the wordmark a little longer */
    const tl = gsap.timeline({ paused: true });
    let holdDone = false;
    let forced = false;
    let started = false;
    const heroReady = () => (window as unknown as { __heroReady?: boolean }).__heroReady === true;
    const tryStart = () => {
      if (started || !holdDone || !(forced || heroReady())) return;
      started = true;
      window.removeEventListener("daneli-hero-ready", tryStart);
      tl.play();
    };
    window.addEventListener("daneli-hero-ready", tryStart);
    timers.push(window.setTimeout(() => { holdDone = true; tryStart(); }, HOLD_MS));
    timers.push(window.setTimeout(() => { holdDone = true; forced = true; tryStart(); }, HERO_MAX_WAIT_MS));

    // 1. one continuous growth, scale 0 -> full screen (slow start, fast finish)
    tl.call(() => {
      ink.style.opacity = "1";
      apply(0);
    });
    const growAt = ">";
    tl.to(state, {
      r: maxR,
      duration: GROW_MS / 1000,
      ease: "power2.in",
      onUpdate: update,
    }, growAt);

    // 2. partway through, the real page starts fading in underneath
    tl.call(() => snapPalette(false), [], `<+=${SNAP_AT_MS / 1000}`);

    // 3. release app state; keep the light DANELI one beat to avoid a handoff pulse
    tl.call(() => {
      snapPalette(true);
      document.body.style.overflow = prevOverflow;
      window.dispatchEvent(new Event("daneli-loader-done"));
      // light screen is fully open: stop compositing it, leave only the word
      cover.style.display = "none";
      if (halo) halo.style.display = "none";
      const remaining = Math.max(180, shiftMs - (GROW_MS - SNAP_AT_MS) + 60);
      timers.push(window.setTimeout(() => setVisible(false), remaining));
    });

    return () => {
      window.removeEventListener("daneli-hero-ready", tryStart);
      tl.kill();
      timers.forEach((t) => window.clearTimeout(t));
      document.body.style.overflow = prevOverflow;
      root.style.removeProperty("--background");
      root.style.removeProperty("--foreground");
    };
  }, []);

  if (!visible) return null;

  const wordClass =
    "font-monument text-[clamp(5rem,18vw,22rem)] font-extrabold uppercase leading-none select-none";
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
        <div className={wordClass} style={{ position: "relative" }}>DANELI</div>
      </div>

      {/* light word, visible only inside the hole */}
      <div ref={inkRef} style={{ ...centre, color: FOREGROUND, opacity: 0, willChange: "mask-image" }}>
        <div className={wordClass}>DANELI</div>
      </div>

      {/* soft glow along the circle's edge */}
      {FX_HALO && <div ref={haloRef} style={{ position: "absolute", inset: 0, opacity: 0 }} />}
    </div>
  );
}