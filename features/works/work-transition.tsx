"use client";

import { createContext, useCallback, useContext, useEffect, useLayoutEffect, useRef } from "react";
import { usePathname, useRouter } from "next/navigation";
import { gsap } from "gsap";

// card <-> page morph. open grows the card to fullscreen and fades into the page,
// close shrinks it back into the card.

export const PAGE_BG = "#070707"; // keep same as slug page bg
export const FADE_ATTR = "data-work-fade";

const OVERLAY_Z = "39"; // above card canvas, below site header

const REVEAL_EVENT = "work:reveal";
const PAUSE_EVENT = "work:pause"; // WarpedCard listens: detail=true stops rendering/decoding
const PUSH_AT = 1; // seconds into the open timeline when the route is pushed

// slug page waits for the overlay to fade before starting its entrance
export function whenWorkRevealed(cb: () => void): () => void {
  if (!document.querySelector("[data-work-overlay]:not([data-revealed])")) {
    cb();
    return () => {};
  }
  let t = 0;
  const run = () => {
    window.clearTimeout(t);
    window.removeEventListener(REVEAL_EVENT, run);
    cb();
  };
  t = window.setTimeout(run, 2500); // never leave the page invisible
  window.addEventListener(REVEAL_EVENT, run, { once: true });
  return () => {
    window.clearTimeout(t);
    window.removeEventListener(REVEAL_EVENT, run);
  };
}

type Ctx = {
  open: (href: string, card: HTMLElement, media: HTMLElement) => void;
  close: () => void;
};
const WorkTransitionContext = createContext<Ctx>({ open: () => {}, close: () => {} });
export const useWorkTransition = () => useContext(WorkTransitionContext);

type Rect = { left: number; top: number; width: number; height: number };
type Overlay = { el: HTMLDivElement; layer: HTMLDivElement };
type Last = {
  slug: string;
  poster: string;
  video: string;
  scrollY: number;
  overlay?: Overlay;
  tl?: gsap.core.Timeline;
};
type LenisLike = {
  stop(): void;
  start(): void;
  resize?(): void;
  scrollTo(t: number, o?: Record<string, unknown>): void;
};

const lenis = () => (window as unknown as { __lenis?: LenisLike }).__lenis;
const pauseCards = (paused: boolean) =>
  window.dispatchEvent(new CustomEvent(PAUSE_EVENT, { detail: paused }));

// Lenis owns the scroll position, so always go through it
const setScroll = (y: number) => {
  const l = lenis();
  if (l) {
    l.resize?.();
    l.scrollTo(y, { immediate: true, force: true });
  } else {
    window.scrollTo({ top: y, behavior: "instant" as ScrollBehavior });
  }
};

const fullRect = (): Rect => ({
  left: 0,
  top: 0,
  width: window.innerWidth,
  height: window.innerHeight,
});

function makeOverlay(
  o: { poster: string; video: string; time?: number },
  r: Rect,
  radius: string,
  layerOpacity: number,
  layerScale: number,
): Overlay {
  const el = document.createElement("div");
  el.setAttribute("data-work-overlay", "");
  Object.assign(el.style, {
    position: "fixed",
    left: `${r.left}px`,
    top: `${r.top}px`,
    width: `${r.width}px`,
    height: `${r.height}px`,
    borderRadius: radius,
    overflow: "hidden",
    isolation: "isolate", // keeps rounded clipping correct on the promoted child layer (Safari)
    zIndex: OVERLAY_Z,
    background: PAGE_BG,
    pointerEvents: "none",
    contain: "layout paint",
  });

  const layer = document.createElement("div");
  layer.style.cssText = `position:absolute;inset:0;opacity:${layerOpacity};transform:scale(${layerScale});will-change:transform,opacity`;
  const cover = "position:absolute;inset:0;width:100%;height:100%;object-fit:cover;display:block";

  const img = document.createElement("img");
  img.src = o.poster;
  img.alt = "";
  img.decoding = "async";
  img.style.cssText = cover;
  layer.appendChild(img);

  if (o.video) {
    const v = document.createElement("video");
    v.preload = "auto";
    v.src = o.video;
    v.muted = true;
    v.loop = true;
    v.playsInline = true;
    v.autoplay = true;
    v.style.cssText = `${cover};opacity:0;transition:opacity .25s`;
    v.addEventListener(
      "loadeddata",
      () => {
        if (o.time) v.currentTime = o.time;
        v.style.opacity = "1";
        v.play().catch(() => {});
      },
      { once: true },
    );
    layer.appendChild(v);
  }

  el.appendChild(layer);
  document.body.appendChild(el);
  return { el, layer };
}

const nextFrames = (n: number) =>
  new Promise<void>((res) => {
    const step = (i: number) => (i <= 0 ? res() : requestAnimationFrame(() => step(i - 1)));
    step(n);
  });

// resolves when the card's <video> has a frame (so the WebGL plane can draw), or after maxMs
const videoReady = (media: HTMLElement, maxMs: number) =>
  new Promise<void>((res) => {
    const v = media.querySelector<HTMLVideoElement>("video");
    const start = performance.now();
    const check = () => {
      if (!v || v.readyState >= 2 || performance.now() - start > maxMs) return res();
      requestAnimationFrame(check);
    };
    check();
  });

// the home page things that fade away while a card opens
const HOME_FADE = "#work [data-head], #work [data-rule], #work [data-meta], #work h3, #work canvas";

// same as HOME_FADE but the card canvas stays: it zooms past instead of fading (see open)
const HOME_FADE_OPEN = "#work [data-head], #work [data-rule], #work [data-meta], #work h3";
const cardCanvas = () => document.querySelector<HTMLElement>("#work canvas");
const resetCanvasZoom = () => {
  const c = cardCanvas();
  if (c) gsap.set(c, { clearProps: "transform,transformOrigin" });
};

// the four fixed site-frame lines (see NavFrameLines)
const FRAME_LINES = "[data-frame-line]";

// the draw-in currently playing on the frame lines, so a new one can take over
let frameDrawTl: gsap.core.Timeline | undefined;

// the lines are hidden while a morph runs; they are re-drawn once the new page has settled
const hideFrameLines = () => {
  frameDrawTl?.kill();
  gsap.killTweensOf(FRAME_LINES);
  gsap.to(FRAME_LINES, { opacity: 0, duration: 0.25, ease: "power1.out", overwrite: true });
};

const drawFrameLines = () => {
  const xs = Array.from(document.querySelectorAll<HTMLElement>(`${FRAME_LINES}.line-x`));
  const ys = Array.from(document.querySelectorAll<HTMLElement>(`${FRAME_LINES}.line-y`));
  const all = [...xs, ...ys];
  if (!all.length) return;

  frameDrawTl?.kill();
  gsap.killTweensOf(FRAME_LINES);
  // take over from the CSS intro animation: lines stay visible, we only reveal them with a clip
  all.forEach((el) => {
    el.style.animation = "none";
    el.style.opacity = "1";
    el.style.transform = "none";
  });

  frameDrawTl = gsap.timeline({
    defaults: { duration: 0.9, ease: "power3.inOut" },
    onComplete: () => all.forEach((el) => (el.style.clipPath = "")),
  });
  // horizontals: left -> right
  if (xs.length) {
    frameDrawTl.fromTo(
      xs,
      { clipPath: "inset(0% 100% 0% 0%)" },
      { clipPath: "inset(0% 0% 0% 0%)", stagger: 0.1 },
      0,
    );
  }
  // verticals: top -> bottom
  if (ys.length) {
    frameDrawTl.fromTo(
      ys,
      { clipPath: "inset(0% 0% 100% 0%)" },
      { clipPath: "inset(0% 0% 0% 0%)", stagger: 0.1 },
      0.15,
    );
  }
};

// next 16 keeps visited pages mounted, so clean up any leftover transition state
const resetHomeState = () => {
  gsap.killTweensOf(HOME_FADE);
  gsap.set(HOME_FADE, { opacity: 1 });
  resetCanvasZoom();
  document
    .querySelectorAll<HTMLElement>("[data-work][data-transitioning]")
    .forEach((card) => card.removeAttribute("data-transitioning"));
  document.querySelectorAll<HTMLElement>("#work [data-media]").forEach((media) => {
    media.style.visibility = "";
  });
  pauseCards(false);
};

export function WorkTransitionProvider({ children }: { children: React.ReactNode }) {
  const router = useRouter();
  const pathname = usePathname();
  const prev = useRef(pathname);
  const last = useRef<Last | null>(null);
  const busy = useRef(false);
  const safety = useRef<number | undefined>(undefined);

  const unlock = () => {
    window.clearTimeout(safety.current);
    busy.current = false;
    pauseCards(false); // if we bail out on the home page, the cards must come back to life
    lenis()?.start();
  };
  const lock = () => {
    busy.current = true;
    lenis()?.stop();
    window.clearTimeout(safety.current);
    // never stay locked if something goes wrong (dev compiles can be slow, so be generous)
    safety.current = window.setTimeout(unlock, 6000);
  };

  useEffect(() => {
    unlock();
    return () => {
      unlock();
      last.current?.tl?.kill();
      last.current?.overlay?.el.remove();
    };
  }, []);

  // we restore scroll ourselves; the browser/Next must not fight us
  useEffect(() => {
    const old = history.scrollRestoration;
    history.scrollRestoration = "manual";
    return () => {
      history.scrollRestoration = old;
    };
  }, []);

  /* ------------------------- card -> page ------------------------- */
  const open = useCallback(
    (href: string, card: HTMLElement, media: HTMLElement) => {
      // ignore clicks mid-transition (the safety timer recovers a stuck state)
      if (busy.current) return;

      const slug = card.dataset.workCard ?? "";
      const poster = card.dataset.poster ?? "";

      lock();
      router.prefetch(href);
      // the site frame goes away first; it is re-drawn once the work page settles
      hideFrameLines();

      const srcVideo = card.querySelector<HTMLVideoElement>("video");
      const video = srcVideo?.currentSrc || card.dataset.video || "";
      const rect = media.getBoundingClientRect();
      const radius = getComputedStyle(media).borderRadius;

      // clear any stale transition state from a previous visit
      last.current?.tl?.kill();
      last.current?.overlay?.el.remove();
      last.current = null;

      const ov = makeOverlay({ poster, video, time: srcVideo?.currentTime }, rect, radius, 1, 1);
      card.setAttribute("data-transitioning", "");
      media.style.visibility = "hidden";

      // stop the 10 WebGL planes + their video decoders: the overlay covers them anyway
      pauseCards(true);
      gsap.to(HOME_FADE_OPEN, { opacity: 0, duration: 0.45, ease: "power2.out", overwrite: true });

      const tl = gsap.timeline({ defaults: { overwrite: "auto" } });
      tl.to(ov.el, { ...fullRect(), borderRadius: 0, duration: 1, ease: "power4.inOut" }, 0)
        .to(ov.layer, { scale: 1.12, duration: 1, ease: "power4.inOut" }, 0)
        // a little tilt that settles flat as the card fills the screen
        .to(
          ov.el,
          {
            keyframes: [
              { rotation: -1.8, duration: 0.45, ease: "power2.out" },
              { rotation: 0, duration: 0.55, ease: "power2.inOut" },
            ],
          },
          0,
        )
        // motion blur that builds, then clears
        .to(
          ov.layer,
          {
            keyframes: [
              { filter: "blur(9px)", duration: 0.4, ease: "power2.in" },
              { filter: "blur(0px)", duration: 0.5, ease: "power2.out" },
            ],
          },
          0.15,
        )
        .to(ov.layer, { opacity: 0, duration: 0.55, ease: "power2.inOut" }, 0.7)
        // push while the dissolve is still running instead of waiting for the end
        .call(() => router.push(href, { scroll: false }), undefined, PUSH_AT);

      // the other cards (drawn on the shared canvas) zoom away from the clicked card
      const gl = cardCanvas();
      if (gl) {
        tl.to(
          gl,
          {
            scale: 1.3,
            transformOrigin: `${rect.left + rect.width / 2}px ${rect.top + rect.height / 2}px`,
            duration: 1,
            ease: "power4.inOut",
          },
          0,
        );
      }

      last.current = { slug, poster, video, scrollY: window.scrollY, overlay: ov, tl };
    },
    [router], // eslint-disable-line react-hooks/exhaustive-deps
  );

  /* ------------------------- page -> card ------------------------- */
  const close = useCallback(() => {
    if (busy.current) return;
    lock();
    // hide the frame first, then re-draw it on the page we land on
    hideFrameLines();
    gsap.to(`[${FADE_ATTR}]`, {
      opacity: 0,
      y: -12,
      duration: 0.3,
      stagger: { each: 0.02 },
      ease: "power2.in",
      // stay locked: the home branch below unlocks when the card has landed
      onComplete: () => {
        if (last.current) router.back();
        else router.push("/");
      },
    });
  }, [router]); // eslint-disable-line react-hooks/exhaustive-deps

  // layout effect: runs before paint, so the new page never flashes at the wrong scroll
  useLayoutEffect(() => {
    const was = prev.current;
    prev.current = pathname;

    // direct visit / reload: no morph runs, so the CSS intro draws the lines in
    if (was === pathname) return;
    const l = last.current;

    /* ---- arrived on a slug page ---- */
    if (pathname.startsWith("/work/")) {
      setScroll(0);
      const ov = l?.overlay;
      resetCanvasZoom();
      if (!ov) {
        drawFrameLines();
        unlock();
        return;
      }

      const reveal = () => {
        // tell the page to start its entrance, and fade the (page-coloured) overlay away
        ov.el.setAttribute("data-revealed", "");
        window.dispatchEvent(new Event(REVEAL_EVENT));
        gsap.to(ov.el, {
          opacity: 0,
          duration: 0.3,
          ease: "power1.out",
          onComplete: () => {
            ov.el.remove();
            if (l) {
              l.overlay = undefined;
              l.tl = undefined;
            }
            // the page has fully revealed: draw the site frame back in on top of it
            drawFrameLines();
            unlock();
          },
        });
      };

      // the route can land before the open timeline has finished: wait for it, never cut it off
      const tl = l?.tl;
      if (tl && tl.progress() < 1) tl.eventCallback("onComplete", reveal);
      else reveal();
      return;
    }

    /* ---- back on home: page colour shrinks into the card ---- */
    if (pathname === "/" && was.startsWith("/work/") && l) {
      lock();
      // hide the site frame while the colour shrinks away; redraw once the card has landed
      hideFrameLines();
      l.overlay?.el.remove();
      const ov = makeOverlay(l, fullRect(), "0px", 0, 1.12);
      l.overlay = ov;

      (async () => {
        await Promise.race([document.fonts?.ready, new Promise((r) => setTimeout(r, 600))]);
        await nextFrames(2);
        setScroll(l.scrollY);

        let card: HTMLElement | null = null;
        let media: HTMLElement | null = null;
        for (let i = 0; i < 90 && !(card && media); i++) {
          card = document.querySelector<HTMLElement>(`[data-work-card="${l.slug}"]`);
          media = card?.querySelector<HTMLElement>("[data-media]") ?? null;
          if (!(card && media)) await nextFrames(1);
        }
        if (!card || !media) {
          ov.el.remove();
          l.overlay = undefined;
          drawFrameLines();
          unlock();
          return;
        }
        const c = card;
        const m = media;
        c.setAttribute("data-transitioning", "");
        m.style.visibility = "hidden";

        // restore the home content that was faded out on open (fresh mount, so make sure)
        gsap.to(HOME_FADE, { opacity: 1, duration: 0.3, ease: "power2.out", overwrite: true });

        let rect = m.getBoundingClientRect();
        if (rect.bottom < 0 || rect.top > window.innerHeight) {
          setScroll(window.scrollY + rect.top - (window.innerHeight - rect.height) / 2);
          await nextFrames(1);
          rect = m.getBoundingClientRect();
        }

        const radius = getComputedStyle(m).borderRadius;
        const tl = gsap.timeline({
          onComplete: async () => {
            // hold until the real card has a video frame AND the GL plane had time to draw it
            await videoReady(m, 1500);
            await nextFrames(2);
            m.style.visibility = "";
            c.removeAttribute("data-transitioning");
            gsap.to(ov.el, {
              opacity: 0,
              duration: 0.35,
              delay: 0.12,
              onComplete: () => {
                ov.el.remove();
                l.overlay = undefined;
                // the card has landed on the home page: draw the site frame back in
                drawFrameLines();
                unlock();
              },
            });
          },
        });
        l.tl = tl;
        tl.to(
          ov.el,
          {
            left: rect.left,
            top: rect.top,
            width: rect.width,
            height: rect.height,
            borderRadius: radius,
            duration: 0.95,
            ease: "power4.inOut",
          },
          0,
        )
          .to(ov.layer, { opacity: 1, duration: 0.5, ease: "power2.out" }, 0.15)
          .to(ov.layer, { scale: 1, duration: 0.95, ease: "power4.inOut" }, 0);
      })();
      return;
    }

    // any other route change: drop any abandoned morph and never stay locked
    if (l) {
      l.tl?.kill();
      l.overlay?.el.remove();
      last.current = null;
    }
    resetHomeState();
    // GridReplay skips work routes, so replay the frame draw-in when leaving one
    if (was.startsWith("/work/")) drawFrameLines();
    unlock();
  }, [pathname]); // eslint-disable-line react-hooks/exhaustive-deps

  return (
    <WorkTransitionContext.Provider value={{ open, close }}>
      {children}
    </WorkTransitionContext.Provider>
  );
}