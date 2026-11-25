"use client";

import { useCallback } from "react";
import { useWorkTransition, type Work } from "@/features/works";
import { FeaturedTitle } from "./components/featured-title";
import { WorkCard } from "./components/work-card";
import { useWorkScene } from "./hooks/use-work-scene";

export function FeaturedWorks({ works }: { works: Work[] }) {
  const { rootRef, canvasRef } = useWorkScene();
  const { open } = useWorkTransition();

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
      <canvas
        ref={canvasRef}
        aria-hidden="true"
        className="pointer-events-none fixed inset-0 z-[35] h-full w-full"
      />
      {/* the hook fades / lifts this wrapper for the section in / out (the fixed canvas stays outside it) */}
      <div data-section-body>
      <div data-head className="mb-14 md:mb-20">
        <div className="grid grid-cols-1 gap-8 md:grid-cols-12 md:gap-x-8">
          <div className="md:col-span-9">
            <FeaturedTitle
              text="Featured Work"
              variant="reveal"
              className="text-[clamp(2.4rem,8.6vw,8rem)]"
            />
          </div>

          <div className="flex flex-col justify-end pt-5 md:col-span-3 md:pl-6 md:pt-0">
            <p className="font-mono text-[10px] uppercase tracking-[0.32em] text-foreground/45">
              Studio / Selection
            </p>
            <p className="mt-4 max-w-[18ch] text-xl font-bold leading-[1.05] tracking-normal text-foreground md:text-2xl">
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
      </div>
    </section>
  );
}

export default FeaturedWorks;