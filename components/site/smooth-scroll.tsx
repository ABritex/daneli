"use client";

import { useEffect, useRef } from "react";
import { usePathname } from "next/navigation";
import Lenis from "lenis";
import { gsap } from "gsap";
import { ScrollTrigger } from "gsap/ScrollTrigger";

gsap.registerPlugin(ScrollTrigger);

// the card <-> page morph (work-transition.tsx) manages scroll for these routes itself
const isWork = (p: string) => p.startsWith("/work/");

/* feel ------------------------------------------------------------- */
const WHEEL_LERP = 0.065; /* mouse wheel / trackpad inertia: lower = floatier */
const ANCHOR_OFFSET = -24; /* px above the section when jumping to it */

const easeInOutQuint = (t: number) =>
  t < 0.5 ? 16 * t * t * t * t * t : 1 - Math.pow(-2 * t + 2, 5) / 2;

const anchorDuration = (distance: number) =>
  Math.min(4.2, Math.max(2.0, 1.4 + Math.sqrt(distance) / 20));

type ScrollToSection = (id: string) => void;

export function SmoothScroll({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const prev = useRef(pathname);

  useEffect(() => {
    const root = document.documentElement;
    window.scrollTo(0, 0);
    const lenis = new Lenis({
      lerp: WHEEL_LERP,
      smoothWheel: true,
      wheelMultiplier: 0.9,
      touchMultiplier: 1.2,
    });
    (window as unknown as { __lenis?: Lenis }).__lenis = lenis; // used by work-transition

    // Drive Lenis from GSAP's ticker, and run it FIRST (prioritize = true) so
    // everything else on the ticker (ScrollTrigger, the WebGL planes) sees the
    // scroll position of the same frame.
    const update = (time: number) => lenis.raf(time * 1000);
    gsap.ticker.add(update, false, true);
    gsap.ticker.lagSmoothing(0);

    lenis.on("scroll", ScrollTrigger.update);
    lenis.scrollTo(0, { immediate: true });

    // Refresh should land at the top (hero/DANELI), not restore a hash target.
    if (window.location.hash) {
      history.replaceState(null, "", window.location.pathname + window.location.search);
      window.scrollTo(0, 0);
      lenis.scrollTo(0, { immediate: true, force: true });
    }

    /* animated jump: eased in and out, duration scales with distance.
       a second request for the same spot while a glide is running is ignored,
       so two triggers (click + a router scroll) can't restart the ease */
    let lastGlide = { y: -1, until: 0 };
    let glide: gsap.core.Tween | null = null;
    const glideTo = (y: number) => {
      const now = performance.now();
      if (Math.abs(y - lastGlide.y) < 4 && now < lastGlide.until) return;
      const max = Math.max(0, document.documentElement.scrollHeight - window.innerHeight);
      const to = Math.max(0, Math.min(max, y));
      const from = lenis.scroll;
      const duration = anchorDuration(Math.abs(to - from));
      lastGlide = { y, until: now + duration * 1000 };
      lenis.start();
      // GSAP owns the animation, Lenis only receives the position each frame.
      // (lenis.scrollTo({ duration, easing }) can silently fall back to an instant
      // jump or its lerp when the constructor has `lerp` set, so we don't rely on it)
      glide?.kill();
      const state = { y: from };
      glide = gsap.to(state, {
        y: to,
        duration,
        ease: easeInOutQuint,
        overwrite: true,
        onUpdate: () => lenis.scrollTo(state.y, { immediate: true, force: true }),
        onComplete: () => {
          glide = null;
        },
      });
    };
    // the user grabbing the wheel / touch / keys cancels a running glide
    const cancelGlide = () => {
      glide?.kill();
      glide = null;
      lastGlide = { y: -1, until: 0 };
    };
    window.addEventListener("wheel", cancelGlide, { passive: true });
    window.addEventListener("touchstart", cancelGlide, { passive: true });
    window.addEventListener("keydown", cancelGlide);

    const scrollToSection: ScrollToSection = (rawId) => {
      const id = rawId.replace(/^\/?#/, "");
      if (!id) {
        glideTo(0);
        return;
      }
      const el = document.getElementById(id);
      if (!el) return;
      glideTo(el.getBoundingClientRect().top + lenis.scroll + ANCHOR_OFFSET);
    };
    (window as unknown as { __scrollToSection?: ScrollToSection }).__scrollToSection =
      scrollToSection;

    /* 1) clicks: any link to a section on this page (<a href="/#work">, "#about", Next <Link>)
       and any element with data-scroll-to="work". capture phase = runs before Next's own handler.
       the URL is deliberately NOT changed: Next hooks history.pushState and answers it with an
       instant jump to the section, which is exactly the teleport we are removing */
    const onClick = (e: MouseEvent) => {
      if (e.defaultPrevented || e.button !== 0 || e.metaKey || e.ctrlKey || e.shiftKey || e.altKey) return;
      const target = e.target as HTMLElement | null;

      const trigger = target?.closest<HTMLElement>("[data-scroll-to]");
      if (trigger) {
        e.preventDefault();
        e.stopPropagation();
        scrollToSection(trigger.dataset.scrollTo ?? "");
        return;
      }

      const a = target?.closest<HTMLAnchorElement>("a[href]");
      if (!a) return;
      const href = a.getAttribute("href");
      if (!href) return;

      const url = new URL(href, window.location.href);
      const samePath = url.pathname === window.location.pathname;
      if (!samePath || !url.hash) return;

      e.preventDefault();
      e.stopPropagation();
      scrollToSection(url.hash);
    };
    document.addEventListener("click", onClick, { capture: true });

    /* 2) safety net: router.push("/#work"), a link from another page, Next's own hash scroll,
       or any code that calls section.scrollIntoView() all end in an instant jump.
       turn that jump into the same eased glide */
    const nativeScrollIntoView = Element.prototype.scrollIntoView;
    Element.prototype.scrollIntoView = function (this: Element, arg?: boolean | ScrollIntoViewOptions) {
      const instant =
        typeof arg === "object" && arg !== null && (arg as ScrollIntoViewOptions).behavior === "instant";
      if (
        !instant &&
        this instanceof HTMLElement &&
        this.id &&
        document.getElementById(this.id) === this &&
        !isWork(window.location.pathname)
      ) {
        scrollToSection(this.id);
        return;
      }
      nativeScrollIntoView.call(this, arg as boolean | ScrollIntoViewOptions);
    };

    // Lenis only moves while the loader is not playing
    const sync = () => {
      if (root.dataset.loader === "playing") lenis.stop();
      else lenis.start();
    };

    sync();
    const observer = new MutationObserver(sync);
    observer.observe(root, { attributes: true, attributeFilter: ["data-loader"] });
    window.addEventListener("daneli-loader-done", sync);

    return () => {
      document.removeEventListener("click", onClick, { capture: true });
      window.removeEventListener("wheel", cancelGlide);
      window.removeEventListener("touchstart", cancelGlide);
      window.removeEventListener("keydown", cancelGlide);
      glide?.kill();
      Element.prototype.scrollIntoView = nativeScrollIntoView;
      gsap.ticker.remove(update);
      window.removeEventListener("daneli-loader-done", sync);
      observer.disconnect();
      delete (window as unknown as { __lenis?: Lenis }).__lenis;
      delete (window as unknown as { __scrollToSection?: ScrollToSection }).__scrollToSection;
      lenis.destroy();
    };
  }, []);

  // Route changes: the page height changed and Next may have reset the native scroll,
  // so Lenis must re-measure and re-sync, otherwise it keeps (and re-emits) the old offset.
  useEffect(() => {
    const was = prev.current;
    prev.current = pathname;
    if (was === pathname) return;

    const id = requestAnimationFrame(() => {
      const lenis = (window as unknown as { __lenis?: Lenis }).__lenis;
      if (lenis) {
        lenis.resize();
        if (!isWork(was) && !isWork(pathname)) {
          if (window.location.hash) {
            const hashId = window.location.hash.replace(/^#/, "");
            const el = hashId ? document.getElementById(hashId) : null;
            const go = (window as unknown as { __scrollToSection?: ScrollToSection }).__scrollToSection;
            if (el && go) go(hashId);
            else lenis.scrollTo(0, { immediate: true, force: true });
          } else {
            lenis.scrollTo(0, { immediate: true, force: true });
          }
        }
      }
      ScrollTrigger.refresh();
    });
    return () => cancelAnimationFrame(id);
  }, [pathname]);

  return <>{children}</>;
}