"use client";

import { useEffect, useRef } from "react";
import { gsap } from "gsap";
import Image from "next/image";
import type { Work } from "@/features/works";
import { useWorkTransition, PAGE_BG, FADE_ATTR } from "@/features/works";

/**
 * Project page. There is no hero image: the opened card dissolves into the page colour
 * (see work-transition.tsx) and this content fades up on top of it.
 * Anything with data-work-fade is animated in here and animated out again on "Back".
 */
export function WorkPage({ work: resolved }: { work?: Work }) {
  const rootRef = useRef<HTMLElement>(null);
  const { close } = useWorkTransition();

  // content fades up (plain tween, no ScrollTrigger: other components kill triggers on cleanup)
  useEffect(() => {
    if (!resolved) return;
    const ctx = gsap.context(() => {
      gsap.fromTo(
        `[${FADE_ATTR}]`,
        { y: 36, opacity: 0 },
        { y: 0, opacity: 1, duration: 0.9, ease: "power3.out", stagger: 0.07, delay: 0.3 },
      );
    }, rootRef);
    return () => ctx.revert();
  }, [resolved]);

  // Escape = back
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") close();
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [close]);

  if (!resolved) {
    return (
      <main className="min-h-screen p-8 text-foreground" style={{ background: PAGE_BG }}>
        <h1 className="text-4xl font-bold">Project not found</h1>
      </main>
    );
  }

  return (
    <main
      ref={rootRef}
      className="min-h-screen text-foreground"
      style={{ background: PAGE_BG }}
    >
      <div className="mx-auto max-w-[1600px] px-8 pb-40 pt-36 md:px-12">
        <div className="grid gap-12 lg:grid-cols-12 lg:gap-16">
          {/* left: tags, title, text */}
          <div className="flex flex-col lg:col-span-5">
            <div
              {...{ [FADE_ATTR]: "" }}
              className="mb-6 flex flex-wrap items-center gap-2 text-xs font-medium uppercase tracking-[0.4em]"
            >
              {resolved.tags.map((t, k) => (
                <span key={t} className="flex items-center gap-2">
                  {k > 0 && <span className="text-foreground/40">•</span>}
                  {t}
                </span>
              ))}
            </div>

            <h1
              {...{ [FADE_ATTR]: "" }}
              className="text-6xl font-bold leading-[1] tracking-tight lg:text-8xl"
            >
              {resolved.name}
            </h1>

            <p
              {...{ [FADE_ATTR]: "" }}
              className="mt-10 max-w-md text-lg leading-relaxed text-foreground/80"
            >
              {resolved.description}
            </p>

            <dl
              {...{ [FADE_ATTR]: "" }}
              className="mt-12 grid max-w-md grid-cols-2 gap-6 border-t border-foreground pt-5 text-xs uppercase tracking-[0.2em]"
            >
              <div>
                <dt className="mb-2 opacity-50">Year</dt>
                <dd>{resolved.year}</dd>
              </div>
              <div>
                <dt className="mb-2 opacity-50">Client</dt>
                <dd>{resolved.client}</dd>
              </div>
              <div>
                <dt className="mb-2 opacity-50">Role</dt>
                <dd>{resolved.role}</dd>
              </div>
              <div>
                <dt className="mb-2 opacity-50">Project</dt>
                <dd>No. {String(resolved.id).padStart(2, "0")}</dd>
              </div>
            </dl>
          </div>

          {/* right: the work itself, framed like the card it came from */}
          <div className="lg:col-span-7">
            <div
              {...{ [FADE_ATTR]: "" }}
              className="relative aspect-[4/3] w-full overflow-hidden bg-[#d6d4d4]"
              style={{ borderRadius: 14 }}
            >
              <video
                src={resolved.video ?? "/bg-test.mp4"}
                poster={resolved.media}
                autoPlay
                loop
                muted
                playsInline
                className="absolute inset-0 h-full w-full object-cover"
              />
            </div>
          </div>
        </div>

        {/* gallery */}
        <div className="mt-24 grid grid-cols-1 gap-6 md:grid-cols-2">
          {resolved.gallery.map((src, i) => (
            <div
              key={i}
              {...{ [FADE_ATTR]: "" }}
              className="relative aspect-[4/3] overflow-hidden bg-[#d6d4d4]"
              style={{ borderRadius: 14 }}
            >
              <Image
                src={src}
                alt={`${resolved.name} ${i + 1}`}
                fill
                sizes="(max-width: 768px) 100vw, 50vw"
                className="object-cover"
                priority={i === 0}
              />
            </div>
          ))}
        </div>
      </div>

      {/* floating back button */}
      <div className="pointer-events-none fixed inset-x-0 bottom-8 z-[80] flex justify-center">
        <button
          type="button"
          {...{ [FADE_ATTR]: "" }}
          onClick={close}
          className="pointer-events-auto inline-flex items-center gap-3 rounded-full border border-foreground bg-background/80 px-6 py-3 text-xs font-medium uppercase tracking-[0.3em] text-foreground backdrop-blur-md transition-colors duration-300 hover:bg-foreground hover:text-background"
        >
          <span aria-hidden="true">←</span>
          Back
        </button>
      </div>
    </main>
  );
}

export default WorkPage;
