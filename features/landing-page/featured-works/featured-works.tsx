"use client";

import { useCallback } from "react";
import { useWorkTransition, type Work } from "@/features/works";
import { FeaturedTitle } from "./featured-title";
import { WorkCard } from "./work-card";
import { useWorkScene } from "./use-work-scene";

/**
 * Featured works.
 *  - every card is the same size, on an even 2-column grid
 *  - the videos are drawn on ONE shared fixed canvas with a perspective camera
 *  - scroll velocity runs through a spring: cards bow, shear and tilt along one
 *    continuous curve, then settle with a little overshoot
 *  - cards grow in from a slightly smaller size as they enter the viewport (scroll linked)
 *  - hover only animates the picture INSIDE the card (zoom + cursor drift) - the card never moves
 *  - all smoothing is time-based, so it feels the same at 60 / 120 / 144 Hz
 *  - heavy work (WebGL, video loading) starts only after the loader finishes
 *  - if WebGL is unavailable the plain <video> elements are shown instead
 */
export function FeaturedWorks({ works }: { works: Work[] }) {
  const { rootRef, canvasRef } = useWorkScene();
  const { open } = useWorkTransition();

  /* Card click -> morph to fullscreen -> route push (see work-transition.tsx) */
  const handleCardClick = useCallback(
    (e: React.MouseEvent, work: Work) => {
      e.preventDefault();
      e.stopPropagation();
      if (!work.href || work.href === "#") return;
      const media = e.currentTarget.querySelector<HTMLElement>("[data-media]");
      if (!media) return;
      open(work.href, e.currentTarget as HTMLElement, media);
    },
    [open],
  );

  return (
    <section id="work" ref={rootRef} className="px-8 pb-24 pt-24 md:px-12 md:pt-28">
      {/* one shared canvas: sits above the page, below the header (z-40) */}
      <canvas
        ref={canvasRef}
        aria-hidden="true"
        className="pointer-events-none fixed inset-0 z-[35] h-full w-full"
      />
      <div data-head className="mb-14 md:mb-20">
        <div className="grid grid-cols-1 gap-8 md:grid-cols-12 md:gap-x-8">
          <div className="md:col-span-9">
            <p
              aria-hidden="true"
              className="mb-2 text-[clamp(4.5rem,16vw,14rem)] font-black leading-[0.82] tracking-[-0.06em] text-foreground/[0.06]"
            >
              03
            </p>
            <div className="[&_h1]:text-[clamp(3.5rem,11vw,9.5rem)] [&_h1]:font-black [&_h1]:leading-[0.88] [&_h1]:tracking-[-0.055em] [&_h2]:text-[clamp(3.5rem,11vw,9.5rem)] [&_h2]:font-black [&_h2]:leading-[0.88] [&_h2]:tracking-[-0.055em] [&_p]:text-[clamp(3.5rem,11vw,9.5rem)] [&_p]:font-black [&_p]:leading-[0.88] [&_p]:tracking-[-0.055em] [&_span]:text-[clamp(3.5rem,11vw,9.5rem)] [&_span]:font-black [&_span]:leading-[0.88] [&_span]:tracking-[-0.055em]">
              <FeaturedTitle text="Featured Work" variant="reveal" />
            </div>
          </div>

          <div className="flex flex-col justify-end pt-5 md:col-span-3 md:pl-6 md:pt-0">
            <p className="font-mono text-[10px] uppercase tracking-[0.32em] text-foreground/45">
              Studio / Selection
            </p>
            <p className="mt-4 max-w-[18ch] text-xl font-bold leading-[1.05] tracking-[-0.03em] text-foreground md:text-2xl">
              A selection of immersive digital experiences created for ambitious brands and forward
              thinking teams.
            </p>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 gap-x-12 gap-y-20 md:grid-cols-2">
        {works.map((w) => (
          <WorkCard key={w.id} work={w} onOpen={handleCardClick} />
        ))}
      </div>
    </section>
  );
}

export default FeaturedWorks;
