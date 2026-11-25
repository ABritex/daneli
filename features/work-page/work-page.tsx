"use client";

import { useEffect, useRef } from "react";
import { gsap } from "gsap";
import Image from "next/image";
import type { Work } from "@/features/works";
import { works, getWorkSlug, useWorkTransition, PAGE_BG, FADE_ATTR } from "@/features/works";

// how far (px of wheel / swipe) you have to keep pushing at the end before the next work opens
const OVERSCROLL = 1100;
const MAX_BLUR = 5;

// archimedean spiral for the "keep scrolling" loader (viewBox 64)
const SPIRAL_D = (() => {
  let d = "";
  for (let t = 0; t <= 6 * Math.PI; t += 0.15) {
    const r = 2 + t * 1.15;
    d += `${d ? "L" : "M"}${(32 + r * Math.cos(t)).toFixed(2)} ${(32 + r * Math.sin(t)).toFixed(2)}`;
  }
  return d;
})();

const PANEL = "w-full md:w-[min(86vw,calc(62vh*1.6))] aspect-[16/10]";
const MB = { filter: "blur(var(--mb, 0px))" } as const; // subtle scroll blur, driven by the track

export function WorkPage({ work: resolved }: { work?: Work }) {
  const rootRef = useRef<HTMLElement>(null);
  const trackRef = useRef<HTMLDivElement>(null);
  const footRef = useRef<HTMLButtonElement>(null);
  const spiralRef = useRef<SVGPathElement>(null);
  const spiralSvgRef = useRef<SVGSVGElement>(null);
  const hintRef = useRef<HTMLSpanElement>(null);
  const { close, next: goNext } = useWorkTransition();

  const idx = resolved ? works.findIndex((w) => w.id === resolved.id) : -1;
  const nextWork = resolved && idx >= 0 ? works[(idx + 1) % works.length] : undefined;
  const hasNext = !!nextWork && nextWork.id !== resolved?.id;

  // latest values for the scroll loop, so its effect does not restart on every render
  const nextRef = useRef(nextWork);
  nextRef.current = hasNext ? nextWork : undefined;
  const goNextRef = useRef(goNext);
  goNextRef.current = goNext;

  const openNext = () => {
    const nw = nextRef.current;
    const foot = footRef.current;
    if (!nw?.href || !foot) return;
    goNextRef.current(
      nw.href,
      { slug: getWorkSlug(nw), poster: nw.media, video: nw.video ?? "/bg-test.mp4" },
      foot,
    );
  };
  const openNextRef = useRef(openNext);
  openNextRef.current = openNext;

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

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") close();
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [close]);

  // text reveals as its panel scrolls into view (horizontal, so the observer is rooted on the track)
  useEffect(() => {
    const el = trackRef.current;
    if (!el || !resolved) return;
    const wraps = Array.from(el.querySelectorAll<HTMLElement>("[data-reveal-word]"));
    const items = Array.from(el.querySelectorAll<HTMLElement>("[data-reveal]"));
    wraps.forEach((w) => gsap.set(w.firstElementChild, { yPercent: 110 }));
    gsap.set(items, { opacity: 0, y: 24 });

    const io = new IntersectionObserver(
      (entries) => {
        for (const e of entries) {
          if (!e.isIntersecting) continue;
          const t = e.target as HTMLElement;
          io.unobserve(t);
          const i = Number(t.dataset.i ?? 0);
          if (t.hasAttribute("data-reveal-word")) {
            gsap.to(t.firstElementChild, { yPercent: 0, duration: 1, ease: "power4.out", delay: i * 0.07 });
          } else {
            gsap.to(t, { opacity: 1, y: 0, duration: 0.9, ease: "power3.out", delay: i * 0.08 });
          }
        }
      },
      { root: el, threshold: 0.35 },
    );
    [...wraps, ...items].forEach((t) => io.observe(t));
    return () => {
      io.disconnect();
      gsap.killTweensOf([...wraps.map((w) => w.firstElementChild), ...items]);
    };
  }, [resolved]);

  // smooth horizontal scroll + subtle motion blur + "keep scrolling" spiral at the end
  useEffect(() => {
    const el = trackRef.current;
    if (!el) return;

    // the same component instance is reused when we go from one work to the next
    el.scrollLeft = 0;
    el.scrollTop = 0;

    // desktop scrolls sideways, below md the page scrolls down natively
    const mq = window.matchMedia("(min-width: 768px)");
    const isH = () => mq.matches;

    const reduceMotion = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    let target = 0;
    let current = 0;
    let velocity = 0;
    let blurAmount = 0;
    let raf = 0;
    let lastTime = performance.now();

    let over = 0; // px pushed past the end
    let lastOver = 0;
    let fired = false;

    // panels pop up (scale + rise + fade) as they scroll in from the right, ease back out on the left
    const pops = Array.from(el.querySelectorAll<HTMLElement>("[data-pop]"));
    const c01 = (v: number) => Math.max(0, Math.min(1, v));

    const path = spiralRef.current;
    const len = path?.getTotalLength() ?? 0;
    if (path) {
      path.style.strokeDasharray = String(len);
      path.style.strokeDashoffset = String(len);
    }

    const max = () =>
      isH() ? Math.max(0, el.scrollWidth - el.clientWidth) : Math.max(0, el.scrollHeight - el.clientHeight);
    const onMq = () => {
      target = current = el.scrollLeft;
    };
    mq.addEventListener("change", onMq);
    const clampTarget = () => {
      target = Math.max(0, Math.min(max(), target));
    };
    const push = (amount: number) => {
      over = Math.min(OVERSCROLL, over + amount);
      lastOver = performance.now();
    };

    const onWheel = (e: WheelEvent) => {
      if (!isH()) {
        // native vertical scroll; only watch for the push past the bottom
        if (!nextRef.current || fired) return;
        if (e.deltaY > 0 && el.scrollTop >= max() - 1) push(e.deltaY);
        else if (e.deltaY < 0) over = 0;
        return;
      }
      if (Math.abs(e.deltaY) <= Math.abs(e.deltaX) && Math.abs(e.deltaX) === 0) return;
      e.preventDefault();
      if (fired) return;
      const delta = Math.abs(e.deltaX) > Math.abs(e.deltaY) ? e.deltaX : e.deltaY;
      if (nextRef.current && delta > 0 && target >= max() - 1) push(delta);
      else if (delta < 0) over = 0;
      target += delta * 0.9;
      clampTarget();
    };

    let tx = 0;
    let ty = 0;
    const onTouchStart = (e: TouchEvent) => {
      tx = e.touches[0].clientX;
      ty = e.touches[0].clientY;
    };
    const onTouchMove = (e: TouchEvent) => {
      const x = e.touches[0].clientX;
      const y = e.touches[0].clientY;
      const dx = tx - x;
      const dy = ty - y;
      tx = x;
      ty = y;
      if (!nextRef.current || fired) return;
      if (isH()) {
        if (dx > 0 && el.scrollLeft >= max() - 1) push(dx * 3);
      } else if (dy > 0 && el.scrollTop >= max() - 1) push(dy * 3);
    };

    const onScroll = () => {
      if (!isH()) return;
      if (Math.abs(el.scrollLeft - current) > 1) {
        target = el.scrollLeft;
        current = el.scrollLeft;
      }
    };

    const tick = (time: number) => {
      const dt = Math.min((time - lastTime) / 1000, 0.05);
      lastTime = time;

      const horizontal = isH();
      if (horizontal) {
        clampTarget();
        const prev = current;
        const ease = reduceMotion ? 1 : 1 - Math.exp(-dt * 5.5);
        current += (target - current) * ease;

        if (Math.abs(target - current) < 0.5) current = target;
        el.scrollLeft = current;

        const rawVelocity = (current - prev) / Math.max(dt, 0.001);
        velocity += (rawVelocity - velocity) * (1 - Math.exp(-dt * 8));
      } else {
        velocity = 0;
      }
      const targetBlur = reduceMotion ? 0 : Math.min(MAX_BLUR, Math.abs(velocity) / 1400);
      blurAmount += (targetBlur - blurAmount) * (1 - Math.exp(-dt * 10));
      el.style.setProperty("--mb", blurAmount > 0.1 ? `${blurAmount.toFixed(2)}px` : "0px");

      const vw = el.clientWidth;
      const vh = el.clientHeight;
      for (const pop of pops) {
        const r = (pop.parentElement as HTMLElement).getBoundingClientRect();
        // sideways on desktop, upwards on mobile
        const kIn = reduceMotion
          ? 1
          : horizontal
            ? c01((vw - r.left) / (vw * 0.45))
            : c01((vh - r.top) / (vh * 0.35));
        const kOut = reduceMotion
          ? 1
          : horizontal
            ? c01(r.right / (vw * 0.3))
            : c01(r.bottom / (vh * 0.25));
        const eIn = 1 - Math.pow(1 - kIn, 3);
        const m = Math.min(eIn, 0.5 + 0.5 * kOut);
        pop.style.transform = `translate3d(0, ${(1 - eIn) * 70}px, 0) scale(${0.8 + 0.2 * m})`;
        pop.style.opacity = String(0.15 + 0.85 * m);
      }

      // spiral fills while you keep pushing, drains if you stop
      if (!fired && over > 0 && performance.now() - lastOver > 300) {
        over = Math.max(0, over - dt * 1800);
      }
      const p = over / OVERSCROLL;
      if (path) path.style.strokeDashoffset = String(len * (1 - p));
      if (spiralSvgRef.current) {
        spiralSvgRef.current.style.transform = `rotate(${p * 300}deg) scale(${1 + p * 0.3})`;
      }
      if (hintRef.current) hintRef.current.style.opacity = String(0.5 + p * 0.5);
      if (p >= 1 && !fired) {
        fired = true;
        openNextRef.current();
      }

      raf = window.requestAnimationFrame(tick);
    };

    el.addEventListener("wheel", onWheel, { passive: false });
    el.addEventListener("scroll", onScroll, { passive: true });
    el.addEventListener("touchstart", onTouchStart, { passive: true });
    el.addEventListener("touchmove", onTouchMove, { passive: true });
    raf = window.requestAnimationFrame(tick);
    return () => {
      mq.removeEventListener("change", onMq);
      el.removeEventListener("wheel", onWheel);
      el.removeEventListener("scroll", onScroll);
      el.removeEventListener("touchstart", onTouchStart);
      el.removeEventListener("touchmove", onTouchMove);
      window.cancelAnimationFrame(raf);
      el.style.removeProperty("--mb");
      pops.forEach((pop) => {
        pop.style.transform = "";
        pop.style.opacity = "";
      });
    };
  }, [resolved]);

  if (!resolved) {
    return (
      <main className="min-h-screen p-8 text-foreground" style={{ background: PAGE_BG }}>
        <h1 className="font-monument text-4xl font-extrabold uppercase">Project not found</h1>
      </main>
    );
  }

  const roles = resolved.role.split(",").map((r) => r.trim()).filter(Boolean);
  const nextWords = (nextWork?.name ?? "").split(" ");

  return (
    <main
      ref={rootRef}
      className="h-dvh overflow-hidden text-foreground"
      style={{ background: PAGE_BG }}
    >
      <div
        ref={trackRef}
        data-lenis-prevent
        className="flex h-full flex-col overflow-y-auto overflow-x-hidden overscroll-contain md:flex-row md:overflow-x-auto md:overflow-y-hidden [scrollbar-width:none] [&::-webkit-scrollbar]:hidden"
      >
        {/* intro panel */}
        <section className="flex w-full shrink-0 flex-col justify-center px-6 pb-12 pt-32 md:h-full md:w-[min(94vw,1000px)] md:px-12 md:py-0 lg:px-16">
          <div
            {...{ [FADE_ATTR]: "" }}
            className="mb-6 flex flex-wrap items-center gap-2 font-screener text-[10px] uppercase tracking-[0.32em] text-foreground/55"
          >
            {resolved.tags.map((t, k) => (
              <span key={t} className="flex items-center gap-2">
                {k > 0 && <span className="text-foreground/35">•</span>}
                {t}
              </span>
            ))}
          </div>

          <h1
            {...{ [FADE_ATTR]: "" }}
            className="work-detail-title max-w-full font-monument font-extrabold uppercase leading-[0.95] tracking-normal"
            // sized so the longest word fits the intro panel; Monument is very wide
            style={{ fontSize: "clamp(1.6rem, 4.6vw, 4.6rem)", overflowWrap: "break-word" }}
          >
            {resolved.name}
          </h1>

          <div className="mt-8 flex flex-col gap-8 md:mt-10 md:flex-row md:gap-14">
            <p
              {...{ [FADE_ATTR]: "" }}
              className="max-w-[26rem] text-sm leading-relaxed text-foreground/65"
            >
              {resolved.description}
            </p>

            <div {...{ [FADE_ATTR]: "" }} className="min-w-[9rem] text-xs leading-[1.9]">
              <p className="mb-2 font-screener text-[10px] uppercase tracking-[0.28em] text-[#ff5a4a]">
                Services
              </p>
              <ul className="text-foreground/70">
                {roles.map((r) => (
                  <li key={r}>{r}</li>
                ))}
              </ul>
              <p className="mb-1 mt-5 font-screener text-[10px] uppercase tracking-[0.28em] text-[#ff5a4a]">
                Client / Year
              </p>
              <p className="text-foreground/70">
                {resolved.client}, {resolved.year}
              </p>
            </div>
          </div>

          {resolved.url && (
            <a
              {...{ [FADE_ATTR]: "" }}
              href={resolved.url}
              target="_blank"
              rel="noreferrer"
              className="mt-10 inline-flex w-fit items-center gap-3 rounded-full bg-foreground px-5 py-3 font-screener text-[10px] uppercase tracking-[0.28em] text-background transition-opacity duration-300 hover:opacity-80"
            >
              <span aria-hidden="true" className="size-1.5 rounded-full bg-background" />
              Launch project
            </a>
          )}
        </section>

        {/* main media panel */}
        <section className="flex shrink-0 items-center px-4 py-3 md:h-full md:px-6 md:py-0">
          <div data-pop className="will-change-transform">
            <div
              {...{ [FADE_ATTR]: "" }}
              className={`relative ${PANEL} overflow-hidden bg-[#111]`}
              style={{ borderRadius: 6, ...MB }}
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
        </section>

        {/* gallery panels */}
        {resolved.gallery.map((src, i) => (
          <section key={i} className="flex h-full shrink-0 items-center px-3 md:px-6">
            <div data-pop className="will-change-transform">
              <div
                {...{ [FADE_ATTR]: "" }}
                className={`relative ${PANEL} overflow-hidden bg-[#111]`}
                style={{ borderRadius: 6, ...MB }}
              >
                <Image
                  src={src}
                  alt={`${resolved.name} ${i + 1}`}
                  fill
                  sizes="(max-width: 768px) 86vw, 62vh"
                  className="object-cover"
                />
              </div>
            </div>
          </section>
        ))}

        {/* next work: the last panel, flush with the end of the track */}
        {hasNext && nextWork && (
          <section className="relative z-10 mt-3 flex h-[72dvh] w-full shrink-0 md:mt-0 md:h-full md:w-[min(88vw,640px)]">
            <button
              ref={footRef}
              type="button"
              {...{ [FADE_ATTR]: "" }}
              onClick={openNext}
              className="group relative flex h-full w-full flex-col justify-between overflow-hidden bg-[#e9e8e3] p-6 text-left text-[#070707] md:p-10"
            >
              <div className="flex items-start justify-between font-screener text-[10px] uppercase tracking-[0.32em] text-[#070707]/55">
                <span data-reveal data-i="0">Next project</span>
                <span data-reveal data-i="1">
                  {String(((idx + 1) % works.length) + 1).padStart(2, "0")} / {String(works.length).padStart(2, "0")}
                </span>
              </div>

              <div>
                <p
                  data-reveal
                  data-i="1"
                  className="mb-5 flex flex-wrap gap-2 font-screener text-[10px] uppercase tracking-[0.32em] text-[#070707]/45"
                >
                  {nextWork.tags.map((t, k) => (
                    <span key={t}>
                      {k > 0 && <span className="mr-2">•</span>}
                      {t}
                    </span>
                  ))}
                </p>
                <h2 className="font-monument text-[clamp(1.8rem,4vw,3.4rem)] font-extrabold uppercase leading-[0.95] tracking-normal text-[#070707]/30 transition-colors duration-500 group-hover:text-[#070707]">
                  {nextWords.map((w, i) => (
                    <span key={i} data-reveal-word data-i={i} className="mr-[0.25em] inline-block overflow-hidden align-top">
                      <span className="inline-block">{w}</span>
                    </span>
                  ))}
                </h2>
              </div>

              <div className="flex items-end justify-between">
                <span
                  ref={hintRef}
                  className="max-w-[12rem] font-screener text-[10px] uppercase leading-relaxed tracking-[0.28em] text-[#070707]/60"
                  style={{ opacity: 0.5 }}
                >
                  Keep scrolling
                  <br />
                  to continue
                </span>
                <svg
                  ref={spiralSvgRef}
                  viewBox="0 0 64 64"
                  className="size-16 shrink-0 text-[#070707] md:size-20"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="1.6"
                  strokeLinecap="round"
                  aria-hidden="true"
                >
                  <path d={SPIRAL_D} opacity="0.15" />
                  <path ref={spiralRef} d={SPIRAL_D} />
                </svg>
              </div>
            </button>
          </section>
        )}
      </div>

      {/* floating back button */}
      <div className="pointer-events-none fixed inset-x-0 bottom-8 z-[80] flex justify-center">
        <button
          type="button"
          {...{ [FADE_ATTR]: "" }}
          onClick={close}
          className="pointer-events-auto inline-flex items-center gap-3 rounded-full border border-foreground/40 bg-background/80 px-6 py-3 font-screener text-[10px] uppercase tracking-[0.28em] text-foreground backdrop-blur-md transition-colors duration-300 hover:bg-foreground hover:text-background"
        >
          <span aria-hidden="true">←</span>
          Back
        </button>
      </div>
    </main>
  );
}

export default WorkPage;