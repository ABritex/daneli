"use client";

import { useEffect, useRef } from "react";
import Link from "next/link";
import { gsap } from "gsap";
import { ScrollTrigger } from "gsap/ScrollTrigger";

gsap.registerPlugin(ScrollTrigger);

type Props = {
  variant?: "screen" | "double";
  headline?: string;
  email?: string;
};

const COLS = [
  {
    title: "Sitemap",
    links: [
      ["Work", "/#work"],
      ["About", "/about"],
      ["Resume", "/resume"],
      ["Blog", "/blog"],
      ["Contact", "/contact"],
    ],
  },
  {
    title: "Elsewhere",
    links: [
      ["Instagram", "#"],
      ["LinkedIn", "#"],
      ["Read.cv", "#"],
    ],
  },
];

export function SiteFooter({
  variant = "double",
  headline = "Let's build what is next.",
  email = "hello@daneli.studio",
}: Props) {
  const root = useRef<HTMLElement>(null);
  const double = variant === "double";

  useEffect(() => {
    const el = root.current;
    if (!el) return;
    const reduce = window.matchMedia("(prefers-reduced-motion: reduce)").matches;

    const ctx = gsap.context(() => {
      const loop = gsap.to("[data-fmq]", {
        xPercent: -25,
        duration: 20,
        ease: "none",
        repeat: -1,
      });

      if (reduce) {
        loop.pause();
        return;
      }

      const ease = double ? "none" : "power3.out";
      const tl = gsap.timeline({
        paused: !double,
        defaults: { ease },
        scrollTrigger: double
          ? { trigger: el, start: "top 55%", end: "bottom bottom", scrub: 0.6 }
          : undefined,
      });

      tl.fromTo("[data-fx]", { scaleX: 0 }, { scaleX: 1, duration: 0.35, stagger: 0.06 }, 0)
        .fromTo("[data-fy]", { scaleY: 0 }, { scaleY: 1, duration: 0.35, stagger: 0.06 }, 0.04)
        .fromTo("[data-fw]", { yPercent: 115 }, { yPercent: 0, duration: 0.42, stagger: 0.07 }, 0.16)
        .fromTo("[data-fc]", { opacity: 0, y: 22 }, { opacity: 1, y: 0, duration: 0.3, stagger: 0.05 }, 0.5)
        .fromTo("[data-fm]", { opacity: 0 }, { opacity: 1, duration: 0.22 }, 0.78);

      if (!double) {
        tl.duration(2.2);
        ScrollTrigger.create({ trigger: el, start: "top 68%", once: true, onEnter: () => tl.play() });
      }
    }, el);

    return () => ctx.revert();
  }, [double]);

  const toTop = () => {
    const lenis = (window as unknown as { __lenis?: { scrollTo: (y: number, o?: object) => void } })
      .__lenis;
    if (lenis) lenis.scrollTo(0, { duration: 1.6 });
    else window.scrollTo({ top: 0, behavior: "smooth" });
  };

  return (
    <footer
      ref={root}
      id="contact"
      className="relative border-t border-foreground bg-background text-foreground"
      style={{ height: double ? "200vh" : "100vh" }}
    >
      <div
        className={`${double ? "sticky top-0" : ""} flex h-screen flex-col overflow-hidden px-6 py-6 md:px-10 md:py-8`}
      >
        {/* structural wires */}
        <span
          data-fy
          aria-hidden
          className="pointer-events-none absolute inset-y-0 left-[33.333%] origin-top border-l border-foreground/12"
        />
        <span
          data-fy
          aria-hidden
          className="pointer-events-none absolute inset-y-0 left-[66.666%] origin-top border-l border-foreground/12"
        />
        <span
          data-fx
          aria-hidden
          className="pointer-events-none absolute inset-x-0 top-[42%] origin-left border-t border-foreground/10"
        />

        {/* top bar */}
        <div data-fc className="relative z-10 flex items-start justify-between gap-6">
          <div>
            <p className="font-mono text-[10px] uppercase tracking-[0.34em] text-foreground/50">
              03 / Contact
            </p>
            <p className="mt-2 font-mono text-[10px] uppercase tracking-[0.22em] text-foreground/40">
              DanEli Studio
            </p>
          </div>
          <button
            type="button"
            onClick={toTop}
            className="border border-foreground/50 bg-transparent px-4 py-2 font-mono text-[10px] uppercase tracking-[0.24em] transition-colors hover:border-foreground hover:bg-foreground hover:text-background"
          >
            Back to top
          </button>
        </div>

        {/* main */}
        <div className="relative z-10 grid flex-1 grid-cols-1 content-center gap-10 py-10 md:grid-cols-12 md:gap-8">
          <div className="md:col-span-8">
            <h2 className="max-w-[11ch] text-[clamp(3.25rem,9.5vw,8.5rem)] font-black leading-[0.9] tracking-[-0.055em] text-balance">
              {headline.split(" ").map((w, i) => (
                <span key={i} className="mr-[0.22em] inline-block overflow-hidden align-bottom pb-[0.04em]">
                  <span data-fw className="inline-block">
                    {w}
                  </span>
                </span>
              ))}
            </h2>
          </div>

          <div data-fc className="flex flex-col justify-end md:col-span-4">
            <span data-fx aria-hidden className="mb-5 block h-px w-full origin-left bg-foreground/25" />
            <p className="font-mono text-[10px] uppercase tracking-[0.3em] text-foreground/45">
              Start a project
            </p>
            <a
              data-cursor-label="Write"
              href={`mailto:${email}`}
              className="mt-4 inline-flex w-fit items-start border-b border-foreground pb-1 text-[clamp(1.25rem,2.2vw,2rem)] font-semibold leading-[1.1] tracking-[-0.03em] transition-opacity hover:opacity-70"
            >
              {email}
            </a>
            <p className="mt-5 max-w-[30ch] text-sm leading-relaxed text-foreground/65">
              Available for selected collaborations in brand, web, spatial interfaces, and motion.
            </p>
          </div>
        </div>

        {/* links */}
        <div data-fc className="relative z-10 grid grid-cols-1 gap-8 border-t border-foreground pt-5 md:grid-cols-12 md:gap-8">
          <div className="md:col-span-4">
            <p className="max-w-[28ch] text-sm font-medium leading-snug tracking-[-0.01em] text-foreground/80">
              DanEli — creative direction and digital craft at the intersection of typography,
              interface, and motion.
            </p>
          </div>
          {COLS.map((c, idx) => (
            <div key={c.title} className={idx === 0 ? "md:col-span-4 md:col-start-7" : "md:col-span-2"}>
              <p className="font-mono text-[10px] uppercase tracking-[0.3em] text-foreground/45">
                {c.title}
              </p>
              <ul className="mt-3 flex flex-col gap-2">
                {c.links.map(([label, href]) => (
                  <li key={label}>
                    <Link
                      href={href}
                      className="text-sm font-medium tracking-[-0.01em] underline-offset-4 transition-opacity hover:underline hover:opacity-70"
                    >
                      {label}
                    </Link>
                  </li>
                ))}
              </ul>
            </div>
          ))}
        </div>

        {/* marquee + base */}
        <div className="relative z-10 mt-6">
          <div data-fm className="overflow-hidden border-y border-foreground/20 py-2">
            <div
              data-fmq
              className="flex w-max whitespace-nowrap font-mono text-[11px] uppercase tracking-[0.32em] text-foreground/55"
            >
              {Array.from({ length: 8 }).map((_, i) => (
                <span key={i} className="pr-10">
                  Available for selected projects · Typography · Interface · Motion ·
                </span>
              ))}
            </div>
          </div>
          <div
            data-fc
            className="flex flex-col gap-2 pt-3 font-mono text-[10px] uppercase tracking-[0.22em] text-foreground/45 sm:flex-row sm:items-center sm:justify-between"
          >
            <span>© 2026 DanEli</span>
            <span>Portfolio / V1</span>
          </div>
        </div>
      </div>
    </footer>
  );
}

export default SiteFooter;
