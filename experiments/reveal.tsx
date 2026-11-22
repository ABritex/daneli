"use client";

import { useEffect } from "react";
import { gsap } from "gsap";
import { ScrollTrigger } from "gsap/ScrollTrigger";

gsap.registerPlugin(ScrollTrigger);

export function Reveal() {
  useEffect(() => {
    try {
      const created: ScrollTrigger[] = [];
      const items = Array.from(document.querySelectorAll<HTMLElement>("[data-reveal]"));
      items.forEach((el) => {
        const tw = gsap.fromTo(
          el,
          { opacity: 0, y: 24 },
          {
            opacity: 1,
            y: 0,
            duration: 0.8,
            ease: "power2.out",
            scrollTrigger: {
              trigger: el,
              start: "top 85%",
              end: "bottom top",
              toggleActions: "play none none none",
            },
          }
        );
        if (tw.scrollTrigger) created.push(tw.scrollTrigger);
      });
      return () => {
        created.forEach((t) => t.kill());
      };
    } catch {
      return undefined;
    }
  }, []);

  return null;
}
