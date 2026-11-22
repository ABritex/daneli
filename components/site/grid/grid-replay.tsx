"use client";

import { useEffect, useRef } from "react";
import { usePathname } from "next/navigation";
import { gsap } from "gsap";

// the card <-> page morph owns these routes, so the grid doesn't replay for them
const isWork = (p: string) => p.startsWith("/work/");

/**
 * Replays the line draw-in on route changes.
 *
 * - The lines themselves live in <NavFrameLines /> (site frame) and in sections
 *   that render <GridLine />.
 * - Work routes are skipped: the card <-> page morph owns that transition.
 * - Reduced motion is respected.
 */
export function GridReplay() {
  const pathname = usePathname();
  const prevPath = useRef(pathname);

  // replay the draw-in on route changes
  useEffect(() => {
    const was = prevPath.current;
    prevPath.current = pathname;
    if (was === pathname) return;
    if (isWork(was) || isWork(pathname)) return;

    const root = document.documentElement;
    if (root.dataset.loader !== "done" && root.dataset.loader !== "skip") return;
    if (window.matchMedia?.("(prefers-reduced-motion: reduce)").matches) return;

    let tl: gsap.core.Timeline | undefined;
    const raf = requestAnimationFrame(() => {
      const xs = Array.from(document.querySelectorAll<HTMLElement>(".line-x"));
      const ys = Array.from(document.querySelectorAll<HTMLElement>(".line-y"));
      const all = [...xs, ...ys];
      if (!all.length) return;

      // take over from the CSS intro animation: lines stay visible, we only reveal them with a clip
      all.forEach((el) => {
        el.style.animation = "none";
        el.style.opacity = "1";
        el.style.transform = "none";
      });

      tl = gsap.timeline({
        defaults: { duration: 0.9, ease: "power3.inOut" },
        onComplete: () => all.forEach((el) => (el.style.clipPath = "")),
      });
      // horizontals: left -> right
      tl.fromTo(
        xs,
        { clipPath: "inset(0% 100% 0% 0%)" },
        { clipPath: "inset(0% 0% 0% 0%)", stagger: 0.1 },
        0,
      );
      // verticals: top -> bottom
      tl.fromTo(
        ys,
        { clipPath: "inset(0% 0% 100% 0%)" },
        { clipPath: "inset(0% 0% 0% 0%)", stagger: 0.1 },
        0.15,
      );
    });

    return () => {
      cancelAnimationFrame(raf);
      tl?.kill();
    };
  }, [pathname]);

  return null;
}
