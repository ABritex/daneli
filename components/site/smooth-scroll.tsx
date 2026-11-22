"use client";

import { useEffect, useRef } from "react";
import { usePathname } from "next/navigation";
import Lenis from "lenis";
import { gsap } from "gsap";
import { ScrollTrigger } from "gsap/ScrollTrigger";

gsap.registerPlugin(ScrollTrigger);

// the card <-> page morph (work-transition.tsx) manages scroll for these routes itself
const isWork = (p: string) => p.startsWith("/work/");

export function SmoothScroll({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const prev = useRef(pathname);

  useEffect(() => {
    const root = document.documentElement;
    const lenis = new Lenis({ lerp: 0.1, smoothWheel: true });
    (window as unknown as { __lenis?: Lenis }).__lenis = lenis; // used by work-transition

    // Drive Lenis from GSAP's ticker, and run it FIRST (prioritize = true) so
    // everything else on the ticker (ScrollTrigger, the WebGL planes) sees the
    // scroll position of the same frame.
    const update = (time: number) => lenis.raf(time * 1000);
    gsap.ticker.add(update, false, true);
    gsap.ticker.lagSmoothing(0);

    lenis.on("scroll", ScrollTrigger.update);
    lenis.scrollTo(0, { immediate: true });

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
      gsap.ticker.remove(update);
      window.removeEventListener("daneli-loader-done", sync);
      observer.disconnect();
      delete (window as unknown as { __lenis?: Lenis }).__lenis;
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
          lenis.scrollTo(0, { immediate: true, force: true });
        }
      }
      ScrollTrigger.refresh();
    });
    return () => cancelAnimationFrame(id);
  }, [pathname]);

  return <>{children}</>;
}
