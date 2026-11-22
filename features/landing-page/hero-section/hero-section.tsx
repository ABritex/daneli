"use client";

import { useEffect, useRef } from "react";
import { gsap } from "gsap";
import { ScrollTrigger } from "gsap/ScrollTrigger";
import { GridLine } from "@/components/site";
import { DaneliWord } from "./daneli-word";
import { ScrollCue } from "./scroll-cue";

gsap.registerPlugin(ScrollTrigger);

export function HeroSection() {
  const heroRef = useRef<HTMLElement>(null);

  useEffect(() => {
    const hero = heroRef.current;
    if (!hero) return;

    const tl = gsap.timeline({
      scrollTrigger: {
        trigger: hero,
        start: "top 80%",
        end: "bottom 40%",
        scrub: 0.6,
      },
    });

    tl.fromTo(
      hero.querySelector<HTMLElement>("[data-intro-fade]") ?? hero,
      { opacity: 0, y: 20 },
      { opacity: 1, y: 0, duration: 1, ease: "power3.out" },
      0
    );
  }, []);

  return (
    <section ref={heroRef} className="relative flex h-screen items-center justify-center overflow-hidden px-4 text-center">
      {/* <video
        data-intro-fade
        src="/bg-test.mp4"
        autoPlay
        loop
        muted
        playsInline
        preload="auto"
        className="absolute inset-0 h-full w-full object-cover opacity-40 blur-lg"
      /> */}
      <div data-intro-fade className="absolute inset-0 bg-gradient-to-t from-background via-transparent to-background/60" />
      <div className="relative z-10 flex flex-col items-center gap-6">
        <DaneliWord className="text-[min(18.56vw,32.2vh)] text-foreground" />
      </div>
      <ScrollCue />

      <div data-intro-fade className="absolute inset-x-0 bottom-0 z-10 translate-y-[9px] px-8 pb-2 md:px-12 md:pb-3">
        <div className="flex items-end justify-between gap-4 pb-1">
          <p className="font-mono text-[11px] font-semibold uppercase tracking-[0.42em] text-foreground/70">
            01 / Selected Work
          </p>
          <p className="font-mono text-[11px] uppercase tracking-[0.28em] text-foreground/45">
            Index
          </p>
        </div>
      </div>

      <GridLine
        className="top-[calc(100vh-1.85rem)]"
        delay="var(--intro-stagger)"
      />
    </section>
  );
}
