"use client";

import type { Work } from "@/features/works";
import { TextAnimate } from "@/components/effects";

const FALLBACK_VIDEO = "/bg-test.mp4";

const GRAIN_SVG =
  "<svg xmlns='http://www.w3.org/2000/svg' width='180' height='180'><filter id='n'><feTurbulence type='fractalNoise' baseFrequency='.85' numOctaves='2' stitchTiles='stitch'/><feColorMatrix values='0 0 0 0 0  0 0 0 0 0  0 0 0 0 0  0 0 0 .55 0'/></filter><rect width='100%' height='100%' filter='url(#n)'/></svg>";
const GRAIN_URL = `url("data:image/svg+xml,${encodeURIComponent(GRAIN_SVG)}")`;

type WorkCardProps = {
  work: Work;
  onOpen: (event: React.MouseEvent, work: Work) => void;
};

export function WorkCard({ work, onOpen }: WorkCardProps) {
  const w = work;
  return (
    <article
      data-work
      data-work-card={(w.href ?? "").replace("/work/", "")}
      data-poster={w.media}
      data-video={w.video ?? FALLBACK_VIDEO}
      className="relative group cursor-pointer"
      onClick={(e) => onOpen(e, w)}
    >
      <div
        data-media
        className="relative aspect-[4/3] w-full overflow-hidden bg-[#070707]"
      >
        <div
          aria-hidden="true"
          className="pointer-events-none absolute inset-0"
          style={{
            backgroundImage: GRAIN_URL,
            opacity: 0.6,
            mixBlendMode: "overlay",
          }}
        />
        {/* src is attached lazily once the card is near the viewport */}
        <video
          data-src={w.video ?? FALLBACK_VIDEO}
          poster={w.media}
          muted
          loop
          playsInline
          preload="none"
          className="absolute inset-0 h-full w-full object-cover"
        />
      </div>
      <div
        data-meta
        className="mt-4 flex flex-wrap items-start gap-x-2 gap-y-1 text-left text-[10px] font-bold uppercase tracking-[0.28em] sm:text-xs sm:tracking-[0.5em]"
      >
        {w.tags.map((t, k) => (
          <span key={t} className="flex items-center gap-2">
            {k > 0 && <span>•</span>}
            <span data-tag data-text={t} className="text-foreground font-bold">
              <TextAnimate as="span">{t}</TextAnimate>
            </span>
          </span>
        ))}
      </div>
      <h3 className="mt-2 overflow-hidden py-1">
        {/* the link is only as wide as the title, so the arrow reacts to the
            title alone, never to the card or the empty space beside it */}
        <a
          href={w.href ?? "#"}
          className="group/title inline-flex w-fit items-center"
        >
          <span data-title className={`flex items-start text-2xl font-extrabold tracking-[-0.02em] text-foreground md:text-3xl`}>
            <span
              aria-hidden="true"
              className="inline-block w-0 -translate-x-3 overflow-hidden whitespace-nowrap opacity-0 transition-[width,transform,opacity,margin] duration-500 ease-[cubic-bezier(.22,1,.36,1)] group-hover/title:mr-3 group-hover/title:w-[1em] group-hover/title:translate-x-0 group-hover/title:opacity-100 group-focus-visible/title:mr-3 group-focus-visible/title:w-[1em] group-focus-visible/title:translate-x-0 group-focus-visible/title:opacity-100"
            >
              →
            </span>
            <TextAnimate as="span">{w.name}</TextAnimate>
          </span>
        </a>
      </h3>
    </article>
  );
}
