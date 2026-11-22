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
  const trackRef = useRef<HTMLDivElement>(null);
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

  // Smooth horizontal scroll + velocity-based motion blur
  useEffect(() => {
    const el = trackRef.current;
    if (!el) return;

    const reduceMotion = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    let target = el.scrollLeft;
    let current = el.scrollLeft;
    let velocity = 0;
    let blurAmount = 0;
    let raf = 0;
    let lastTime = performance.now();

    const clampTarget = () => {
      const max = Math.max(0, el.scrollWidth - el.clientWidth);
      target = Math.max(0, Math.min(max, target));
    };

    const onWheel = (e: WheelEvent) => {
      if (Math.abs(e.deltaY) <= Math.abs(e.deltaX) && Math.abs(e.deltaX) === 0) return;
      e.preventDefault();
      const delta = Math.abs(e.deltaX) > Math.abs(e.deltaY) ? e.deltaX : e.deltaY;
      target += delta * 0.9;
      clampTarget();
    };

    const onScroll = () => {
      // keep target in sync for drag/trackpad/native scroll interactions
      if (Math.abs(el.scrollLeft - current) > 1) {
        target = el.scrollLeft;
        current = el.scrollLeft;
      }
    };

    const tick = (time: number) => {
      const dt = Math.min((time - lastTime) / 1000, 0.05);
      lastTime = time;

      clampTarget();
      const prev = current;
      const ease = reduceMotion ? 1 : 1 - Math.exp(-dt * 5.5);
      current += (target - current) * ease;

      if (Math.abs(target - current) < 0.5) current = target;
      el.scrollLeft = current;

      const rawVelocity = (current - prev) / Math.max(dt, 0.001);
      velocity += (rawVelocity - velocity) * (1 - Math.exp(-dt * 8));
      const targetBlur = reduceMotion ? 0 : Math.min(14, Math.abs(velocity) / 650);
      blurAmount += (targetBlur - blurAmount) * (1 - Math.exp(-dt * 10));

      if (blurAmount > 0.15) {
        el.style.filter = `blur(${blurAmount.toFixed(2)}px)`;
        el.style.willChange = "filter, scroll-position";
      } else {
        if (el.style.filter) el.style.filter = "";
        if (el.style.willChange) el.style.willChange = "";
      }

      raf = window.requestAnimationFrame(tick);
    };

    el.addEventListener("wheel", onWheel, { passive: false });
    el.addEventListener("scroll", onScroll, { passive: true });
    raf = window.requestAnimationFrame(tick);
    return () => {
      el.removeEventListener("wheel", onWheel);
      el.removeEventListener("scroll", onScroll);
      window.cancelAnimationFrame(raf);
      el.style.filter = "";
      el.style.willChange = "";
    };
  }, [resolved]);

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
      className="h-screen overflow-hidden text-foreground"
      style={{ background: PAGE_BG }}
    >
      <div
        ref={trackRef}
        data-lenis-prevent
        className="flex h-full overflow-x-auto overflow-y-hidden [scrollbar-width:none] [&::-webkit-scrollbar]:hidden"
      >
        {/* intro panel */}
        <section className="flex h-full w-[min(92vw,900px)] shrink-0 flex-col justify-center px-8 md:px-12 lg:px-16">
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
        </section>

        {/* main media panel */}
        <section className="flex h-full w-[min(92vw,1200px)] shrink-0 items-center px-4 md:px-8">
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
        </section>

        {/* gallery panels */}
        {resolved.gallery.map((src, i) => (
          <section
            key={i}
            className="flex h-full w-[min(88vw,1000px)] shrink-0 items-center px-4 md:px-8"
          >
            <div
              {...{ [FADE_ATTR]: "" }}
              className="relative aspect-[4/3] w-full overflow-hidden bg-[#d6d4d4]"
              style={{ borderRadius: 14 }}
            >
              <Image
                src={src}
                alt={`${resolved.name} ${i + 1}`}
                fill
                sizes="(max-width: 768px) 88vw, 1000px"
                className="object-cover"
                priority={i === 0}
              />
            </div>
          </section>
        ))}

        <div className="h-full w-16 shrink-0 md:w-24" aria-hidden="true" />
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