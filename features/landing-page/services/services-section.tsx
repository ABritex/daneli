"use client";

import { useEffect, useRef, useState } from "react";
import { gsap } from "gsap";
import { ScrollTrigger } from "gsap/ScrollTrigger";
import { ServiceFigure } from "./components/service-figure";
import { LABEL, SERVICES } from "./data";
import { SHAPES, toD } from "./lib/shapes";

gsap.registerPlugin(ScrollTrigger);

export function ServicesSection() {
  const ref = useRef<HTMLElement>(null);
  const outerRef = useRef<SVGPathElement>(null);
  const innerRef = useRef<SVGPathElement>(null);
  const cur = useRef({ outer: [...SHAPES[0].outer], inner: [...SHAPES[0].inner] });
  const [active, setActive] = useState(0);

  useEffect(() => {
    const el = ref.current;
    if (!el) return;

    const ctx = gsap.context(() => {
      gsap
        .timeline({
          scrollTrigger: { trigger: el, start: "top 85%", end: "top 25%", scrub: 1 },
        })
        .fromTo("[data-title]", { yPercent: 115 }, { yPercent: 0, duration: 0.5, ease: "power3.out" }, 0)
        .fromTo(
          "[data-shape]",
          { opacity: 0, scale: 0.85, rotate: -12 },
          { opacity: 1, scale: 1, rotate: 0, duration: 0.6, ease: "power3.out" },
          0.1,
        )
        .fromTo(
          "[data-row]",
          { opacity: 0, y: 40 },
          { opacity: 1, y: 0, duration: 0.5, stagger: 0.08, ease: "power3.out" },
          0.12,
        )
        .fromTo("[data-meta]", { opacity: 0 }, { opacity: 1, duration: 0.4 }, 0.2);

      gsap
        .timeline({
          scrollTrigger: { trigger: el, start: "bottom 75%", end: "bottom 15%", scrub: 1 },
        })
        .fromTo(
          "[data-row]",
          { opacity: 1, y: 0 },
          { opacity: 0, y: -30, duration: 0.4, stagger: 0.05, ease: "power2.in", immediateRender: false },
          0,
        )
        .fromTo("[data-meta]", { opacity: 1 }, { opacity: 0, duration: 0.3, immediateRender: false }, 0)
        .fromTo(
          "[data-title]",
          { yPercent: 0 },
          { yPercent: -115, duration: 0.45, ease: "power3.in", immediateRender: false },
          0.15,
        )
        .fromTo(
          "[data-shape]",
          { opacity: 1, scale: 1 },
          { opacity: 0, scale: 1.25, duration: 0.6, ease: "power2.in", immediateRender: false },
          0,
        );
    }, el);

    return () => ctx.revert();
  }, []);

  // morph the shape when active service changes
  useEffect(() => {
    const from = { o: [...cur.current.outer], i: [...cur.current.inner] };
    const to = SHAPES[active];
    const p = { v: 0 };

    const tween = gsap.to(p, {
      v: 1,
      duration: 0.9,
      ease: "power3.inOut",
      onUpdate: () => {
        const o = from.o.map((x, k) => x + (to.outer[k] - x) * p.v);
        const n = from.i.map((x, k) => x + (to.inner[k] - x) * p.v);
        cur.current = { outer: o, inner: n };
        outerRef.current?.setAttribute("d", toD(o));
        innerRef.current?.setAttribute("d", toD(n));
      },
    });

    return () => {
      tween.kill();
    };
  }, [active]);

  return (
    <section
      id="services"
      ref={ref}
      className="relative flex min-h-screen flex-col justify-center overflow-hidden px-6 py-28 md:px-12"
    >
      <ServiceFigure outerRef={outerRef} innerRef={innerRef} />

      <div className="relative z-10 mx-auto w-full max-w-7xl">
        <div className="overflow-hidden py-1">
          <h2
            data-title
            className="font-monument text-[clamp(2.5rem,9vw,8.5rem)] font-extrabold uppercase leading-[0.95] tracking-normal text-foreground"
          >
            Services
          </h2>
        </div>

        <div className="mt-12 grid grid-cols-12 gap-x-6 gap-y-8 md:mt-20">
          {/* left side label/counter */}
          <div data-meta className="col-span-12 md:col-span-3 md:sticky md:top-32 md:self-start">
            <p className={LABEL}>
              (What I do)
              <br />
              {String(SERVICES.length).padStart(2, "0")} disciplines
            </p>
            <p className="mt-4 hidden font-monument text-[clamp(2rem,4vw,3.5rem)] font-extrabold tabular-nums leading-none text-foreground/20 md:block">
              {String(active + 1).padStart(2, "0")}
            </p>
            <p className={`mt-4 hidden md:block ${LABEL}`}>
              Fig. {String(active + 1).padStart(2, "0")}
              <br />
              {SERVICES[active].fig}
            </p>
          </div>

          {/* service rows */}
          <ul className="col-span-12 md:col-span-9">
            {SERVICES.map((s, i) => {
              const open = i === active;
              return (
                <li key={s.name} data-row>
                  <button
                    type="button"
                    aria-expanded={open}
                    onMouseEnter={() => setActive(i)}
                    onFocus={() => setActive(i)}
                    onClick={() => setActive(i)}
                    className={`group grid w-full grid-cols-[2.5rem_1fr] py-3 text-left transition-opacity duration-500 md:grid-cols-[4rem_1fr] md:py-4 ${
                      open ? "opacity-100" : "opacity-30 hover:opacity-60"
                    }`}
                  >
                    <span className="pt-[0.55em] font-mono text-[10px] tabular-nums tracking-[0.2em] text-foreground/60">
                      {String(i + 1).padStart(2, "0")}
                    </span>

                    <span>
                      <span
                        className={`block font-monument text-[clamp(1.3rem,3.6vw,3.5rem)] font-extrabold uppercase leading-none tracking-normal text-foreground transition-transform duration-500 ease-[cubic-bezier(.22,1,.36,1)] group-hover:translate-x-2 ${
                          open ? "translate-x-2" : ""
                        }`}
                      >
                        {s.name}
                      </span>

                      <span
                        className={`grid transition-[grid-template-rows,opacity] duration-500 ease-[cubic-bezier(.22,1,.36,1)] ${
                          open ? "grid-rows-[1fr] opacity-100" : "grid-rows-[0fr] opacity-0"
                        }`}
                      >
                        <span className="overflow-hidden">
                          <span className="block max-w-xl pb-2 pl-2 pt-4 text-sm leading-relaxed text-foreground/60 md:text-base">
                            {s.text}
                          </span>
                          <span className={`block pb-1 pl-2 ${LABEL} text-foreground/70`}>
                            {s.tools.join("  /  ")}
                          </span>
                        </span>
                      </span>
                    </span>
                  </button>
                </li>
              );
            })}
          </ul>
        </div>
      </div>
    </section>
  );
}
