import { gsap, ScrollTrigger } from "@/lib/gsap";
import { scrambleCardTags } from "@/lib/animations";
import {
  ENTER_SCALE,
  IN_END,
  IN_RISE,
  IN_START,
  OUT_END,
  OUT_LIFT,
  OUT_START,
} from "../config/scene";
import type { Plane } from "./use-work-canvas";

export function initWorkScrollAnimations(root: HTMLElement, planes: Plane[], sectionBody: HTMLElement | null) {
  /* ------------------------ GSAP scroll effects ------------------------ */
  const mm = gsap.matchMedia();
  mm.add(
    "(prefers-reduced-motion: no-preference)",
    () => {
      /* whole-section transition, scrubbed to the scroll position (reverses when you scroll back).
         IN starts while the hero is still dissolving; OUT overlaps About drawing itself in */
      if (sectionBody) {
        gsap
          .timeline({
            scrollTrigger: { trigger: root, start: IN_START, end: IN_END, scrub: 1 },
          })
          .fromTo(sectionBody, { y: IN_RISE, opacity: 0 }, { y: 0, opacity: 1, ease: "power3.out", duration: 1 });

        gsap
          .timeline({
            scrollTrigger: { trigger: root, start: OUT_START, end: OUT_END, scrub: 1 },
          })
          .fromTo(
            sectionBody,
            { y: 0, opacity: 1 },
            { y: -OUT_LIFT, opacity: 0, ease: "power2.in", duration: 1, immediateRender: false },
          );
      }

      gsap.utils.toArray<HTMLElement>("[data-work]", root).forEach((card) => {
        const media = card.querySelector<HTMLElement>("[data-media]");
        const title = card.querySelector<HTMLElement>("[data-title]");
        const meta = card.querySelector<HTMLElement>("[data-meta]");
        if (!media || !title || !meta) return;

        // with WebGL the entrance is scroll-linked inside the render loop;
        // only the plain <video> fallback needs a tween
        const plane = planes.find((p) => p.el === media);
        if (!plane) {
          gsap.fromTo(
            media,
            { scale: ENTER_SCALE, opacity: 0.35 },
            {
              scale: 1,
              opacity: 1,
              duration: 1.4,
              ease: "expo.out",
              scrollTrigger: { trigger: card, start: "top 92%", once: true },
            },
          );
        }

        gsap.fromTo(
          title,
          { yPercent: 110 },
          {
            yPercent: 0,
            duration: 1,
            ease: "power4.out",
            scrollTrigger: { trigger: card, start: "top 80%", once: true },
          },
        );
        gsap.fromTo(
          meta,
          { opacity: 0, y: 10 },
          {
            opacity: 1,
            y: 0,
            duration: 0.8,
            delay: 0.15,
            ease: "power2.out",
            onStart: () => scrambleCardTags(card),
            scrollTrigger: { trigger: card, start: "top 80%", once: true },
          },
        );
      });
    },
    root,
  );

  const refresh = () => ScrollTrigger.refresh();
  document.fonts?.ready.then(refresh);
  const raf = requestAnimationFrame(refresh);

  return () => {
    cancelAnimationFrame(raf);
    mm.revert();
  };
}
