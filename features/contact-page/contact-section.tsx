"use client";

import { useEffect, useRef, useState } from "react";
import { gsap } from "gsap";
import { ScrollTrigger } from "gsap/ScrollTrigger";
import { CONTACT_EMAIL, ContactFooter } from "./contact-footer";

gsap.registerPlugin(ScrollTrigger);

/* floating stones: position in % of the section, size in px, depth = how far they follow the cursor */
const ROCKS = [
  { x: 24, y: 34, size: 132, depth: 0.9, rot: -14, radius: "52% 48% 44% 56% / 58% 46% 54% 42%", hide: false },
  { x: 16, y: 58, size: 150, depth: 1.2, rot: 22, radius: "46% 54% 58% 42% / 50% 56% 44% 50%", hide: true },
  { x: 47, y: 26, size: 92, depth: 0.5, rot: 8, radius: "56% 44% 48% 52% / 44% 58% 42% 56%", hide: false },
  { x: 71, y: 33, size: 120, depth: 0.8, rot: 30, radius: "48% 52% 56% 44% / 54% 44% 56% 46%", hide: true },
  { x: 77, y: 56, size: 148, depth: 1.3, rot: -20, radius: "54% 46% 42% 58% / 46% 54% 46% 54%", hide: false },
  { x: 53, y: 74, size: 140, depth: 1.0, rot: 12, radius: "44% 56% 50% 50% / 56% 42% 58% 44%", hide: true },
];

const HEADLINE = ["Let's", "work", "together"];

export function ContactSection() {
  const sectionRef = useRef<HTMLElement>(null);
  const [email, setEmail] = useState("");

  useEffect(() => {
    const section = sectionRef.current;
    if (!section) return;

    const ctx = gsap.context(() => {
      const q = gsap.utils.selector(section);

      /* headline: words rise out of masks, then the rest fades up */
      const intro = gsap.timeline({
        scrollTrigger: { trigger: section, start: "top 60%", once: true },
      });
      intro
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
          q("[data-cta-form]"),
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

      /* stones: scroll-linked grow-in, then a slow endless float */
      const rocks = q("[data-rock]");
      gsap.fromTo(
        rocks,
        { scale: 0.55, opacity: 0 },
        {
          scale: 1,
          opacity: 1,
          ease: "power2.out",
          stagger: 0.08,
          scrollTrigger: {
            trigger: section,
            start: "top 85%",
            end: "top 15%",
            scrub: 1,
          },
        },
      );

      q("[data-rock-inner]").forEach((el, i) => {
        gsap.to(el, {
          y: i % 2 ? -16 : 16,
          rotation: i % 2 ? "-=7" : "+=7",
          duration: 3.2 + i * 0.45,
          ease: "sine.inOut",
          yoyo: true,
          repeat: -1,
        });
      });

      /* stones follow the cursor, nearer ones further */
      const movers = (q("[data-rock]") as HTMLElement[]).map((el) => ({
        depth: Number(el.dataset.depth ?? 1),
        x: gsap.quickTo(el, "x", { duration: 1.1, ease: "power3.out" }),
        y: gsap.quickTo(el, "y", { duration: 1.1, ease: "power3.out" }),
      }));
      const onMove = (e: PointerEvent) => {
        const nx = e.clientX / window.innerWidth - 0.5;
        const ny = e.clientY / window.innerHeight - 0.5;
        for (const m of movers) {
          m.x(-nx * 70 * m.depth);
          m.y(-ny * 50 * m.depth);
        }
      };
      window.addEventListener("pointermove", onMove);
      return () => window.removeEventListener("pointermove", onMove);
    }, section);

    return () => ctx.revert();
  }, []);

  const onSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const subject = encodeURIComponent("Project inquiry");
    const body = encodeURIComponent(
      `Hi Daniel,\n\nI'd like to talk about a project.\n\nYou can reach me at: ${email}`,
    );
    window.location.href = `mailto:${CONTACT_EMAIL}?subject=${subject}&body=${body}`;
  };

  return (
    <section
      id="contact"
      ref={sectionRef}
      className="relative isolate flex min-h-screen flex-col overflow-hidden"
    >
      {/* soft light pooling in the centre, fading into the page colour */}
      <div
        aria-hidden="true"
        className="pointer-events-none absolute inset-0 -z-10"
        style={{
          background:
            "radial-gradient(ellipse 62% 52% at 50% 46%, rgba(230,229,224,0.11) 0%, rgba(230,229,224,0.04) 45%, transparent 75%)",
        }}
      />

      {/* floating stones */}
      <div aria-hidden="true" className="pointer-events-none absolute inset-0 -z-10">
        {ROCKS.map((r, i) => (
          <div
            key={i}
            data-rock
            data-depth={r.depth}
            className={`absolute will-change-transform ${r.hide ? "hidden md:block" : ""}`}
            style={{
              left: `${r.x}%`,
              top: `${r.y}%`,
              width: r.size,
              height: r.size * 0.82,
              marginLeft: -r.size / 2,
              marginTop: -(r.size * 0.82) / 2,
            }}
          >
            <div
              data-rock-inner
              className="h-full w-full"
              style={{
                rotate: `${r.rot}deg`,
                borderRadius: r.radius,
                background:
                  "radial-gradient(circle at 32% 26%, #6a6762 0%, #3a3835 34%, #1c1b1a 68%, #0d0d0c 100%)",
                boxShadow:
                  "inset -10px -14px 26px rgba(0,0,0,0.65), inset 6px 8px 16px rgba(255,255,255,0.06), 0 30px 60px rgba(0,0,0,0.6)",
                opacity: 0.78,
              }}
            />
          </div>
        ))}
      </div>

      {/* CTA */}
      <div className="relative flex flex-1 flex-col items-center justify-center px-6 py-32 text-center">
        <p
          data-eyebrow
          className="font-mono text-[10px] uppercase tracking-[0.32em] text-foreground/50"
        >
          05 / Contact — Have a project in mind?
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

        <form
          data-cta-form
          onSubmit={onSubmit}
          className="relative isolate mt-12 flex w-full max-w-md flex-col gap-3 sm:flex-row"
        >
          <input
            type="email"
            required
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            placeholder="Enter your email..."
            aria-label="Your email"
            className="h-12 w-full flex-1 rounded-[16px] bg-[#161616] px-5 text-sm text-foreground outline-none ring-1 ring-white/5 transition-shadow placeholder:text-foreground/40 focus:ring-foreground/30"
          />
          <button
            type="submit"
            className="rgb-btn relative h-12 shrink-0 rounded-[16px] bg-[#e6e5e0] px-6 text-sm font-semibold text-[#070707]"
          >
            Let&apos;s talk
          </button>
        </form>
      </div>

      <ContactFooter />
    </section>
  );
}
