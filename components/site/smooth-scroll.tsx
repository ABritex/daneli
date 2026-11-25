"use client";

import { useEffect, useRef } from "react";
import { usePathname } from "next/navigation";
import Lenis from "lenis";
import { gsap } from "gsap";
import { ScrollTrigger } from "gsap/ScrollTrigger";

gsap.registerPlugin(ScrollTrigger);

// work transition handles scroll on these pages
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

    // drive lenis from gsap ticker first so scrolltrigger/webgl see the same frame
    const update = (time: number) => lenis.raf(time * 1000);
    gsap.ticker.add(update, false, true);
    gsap.ticker.lagSmoothing(0);

    lenis.on("scroll", ScrollTrigger.update);
    lenis.scrollTo(0, { immediate: true });

    // refresh should always land at top, not jump to a hash
    if (window.location.hash) {
      history.replaceState(null, "", window.location.pathname + window.location.search);
      window.scrollTo(0, 0);
      lenis.scrollTo(0, { immediate: true, force: true });
    }

    // smooth jump, ignore duplicate calls while it's already gliding there
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
      // gsap drives it, lenis just follows frame by frame
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
    // if user takes over, stop the glide
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

    // catch section links before next does its instant jump thing
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

    // safety net: turn instant section jumps into the same glide
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

    // pause lenis while loader is playing
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

  // on route change, re-measure and reset scroll so lenis doesn't get stuck
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