"use client";

import { useEffect, useRef } from "react";
import { gsap } from "gsap";
import { ScrollTrigger } from "gsap/ScrollTrigger";
import { ContactFooter } from "./contact-footer";
import { ContactScene } from "./contact-scene";

gsap.registerPlugin(ScrollTrigger);

/* edit these: where the button goes and what it says */
const CTA_HREF = "#";
const CTA_LABEL = "Let's talk";

const HEADLINE = ["Let's", "work", "together"];

export function ContactSection() {
  const sectionRef = useRef<HTMLElement>(null);

  useEffect(() => {
    const section = sectionRef.current;
    if (!section) return;

    const ctx = gsap.context(() => {
      const q = gsap.utils.selector(section);

      /* headline: words rise out of masks, then the button and footer fade up */
      gsap
        .timeline({
          scrollTrigger: { trigger: section, start: "top 60%", once: true },
        })
        .fromTo(
          q("[data-eyebrow]"),
          { opacity: 0, y: 14 },
          { opacity: 1, y: 0, duration: 0.8, ease: "power2.out" },
          0,
        )
        .fromTo(
          q("[data-word]"),
          { yPercent: 115 },
          { yPercent: 0, duration: 1.1, stagger: 0.1, ease: "power4.out" },
          0.1,
        )
        .fromTo(
          q("[data-cta]"),
          { opacity: 0, y: 24 },
          { opacity: 1, y: 0, duration: 0.9, ease: "power3.out" },
          0.55,
        )
        .fromTo(
          q("[data-footer-item]"),
          { opacity: 0, y: 16 },
          { opacity: 1, y: 0, duration: 0.8, stagger: 0.08, ease: "power2.out" },
          0.8,
        );
    }, section);

    return () => ctx.revert();
  }, []);

  return (
    <section
      id="contact"
      ref={sectionRef}
      className="relative isolate flex min-h-screen flex-col overflow-hidden"
    >
      {/* soft light pooling in the centre, fading into the page colour */}
      <div
        aria-hidden="true"
        className="pointer-events-none absolute inset-0 -z-20"
        style={{
          background:
            "radial-gradient(ellipse 62% 52% at 50% 46%, rgba(230,229,224,0.11) 0%, rgba(230,229,224,0.04) 45%, transparent 75%)",
        }}
      />

      {/* three.js stones */}
      <ContactScene />

      {/* CTA */}
      <div className="relative flex flex-1 flex-col items-center justify-center px-6 py-32 text-center">
        <p
          data-eyebrow
          className="font-mono text-[10px] uppercase tracking-[0.32em] text-foreground/50"
        >
          06 / Contact — Have a project in mind?
        </p>

        <h2 className="mt-6 flex flex-wrap items-baseline justify-center gap-x-[0.28em] text-[clamp(3rem,9vw,8.5rem)] font-black leading-[0.9] tracking-[-0.055em] text-foreground">
          {HEADLINE.map((w) => (
            <span key={w} className="inline-block overflow-y-clip pb-[0.08em]">
              <span data-word className="inline-block">
                {w}
              </span>
            </span>
          ))}
        </h2>

        <div data-cta className="relative isolate mt-12">
          <a
            href={CTA_HREF}
            className="rgb-btn relative inline-flex h-14 items-center justify-center rounded-[16px] bg-[#e6e5e0] px-10 text-sm font-semibold text-[#070707]"
          >
            {CTA_LABEL}
          </a>
        </div>
      </div>

      <ContactFooter />
    </section>
  );
}