"use client";

import Image from "next/image";
import { useEffect, useRef } from "react";
import { gsap } from "gsap";
import { ScrollTrigger } from "gsap/ScrollTrigger";

gsap.registerPlugin(ScrollTrigger);

/** same switch as the reel stage / work scene: keep the animation even when the OS asks for reduced motion */
const IGNORE_REDUCED_MOTION = true;

const WORD = "PORTFOLIO".split("");

type Layer = "back" | "front";

/** one row of masked letters. `back` is a bright filled word behind the face, `front` is the outline that crosses over it */
function Word({ layer }: { layer: Layer }) {
  return (
    <span
      className="flex select-none font-monument font-extrabold uppercase leading-none"
      style={{ fontSize: "clamp(4rem, 14vw, 16rem)", color: "#e6e5e0" }}
      aria-hidden="true"
    >
      {WORD.map((l, i) => (
        <span key={`${layer}${i}`} className="inline-block overflow-y-clip pb-[0.06em]">
          <span
            data-letter={layer}
            className={
              layer === "back"
                ? "inline-block"
                : "inline-block text-transparent"
            }
            style={
              layer === "front"
                ? { WebkitTextStroke: "2px rgba(230,229,224,0.95)" }
                : undefined
            }
          >
            {l}
          </span>
        </span>
      ))}
    </span>
  );
}

export function AboutSection() {
  const sectionRef = useRef<HTMLElement>(null);
  const measureRef = useRef<HTMLSpanElement>(null);
  const imageWrapRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const section = sectionRef.current;
    const measure = measureRef.current;
    const imageWrap = imageWrapRef.current;
    if (!section || !measure || !imageWrap) return;

    const q = gsap.utils.selector(section);
    const mm = gsap.matchMedia();

    mm.add(
      { reduce: "(prefers-reduced-motion: reduce)" },
      (ctx) => {
        const { reduce } = ctx.conditions as { reduce: boolean };

        const backWrap = q("[data-word-wrap='back']");
        const frontWrap = q("[data-word-wrap='front']");
        const image = q("[data-image]");
        const copyItems = q("[data-copy-item]");
        const lines = q("[data-copy-line]");
        const rule = q("[data-rule]");

        /* how far each one has to travel to be completely out of the viewport.
           measured, so it holds at any screen size (+6% so nothing peeks at the edge) */
        const vw = () => window.innerWidth;
        const wordOut = () => -(vw() / 2 + measure.offsetWidth / 2 + vw() * 0.06);
        const imageOut = () => vw() / 2 + imageWrap.offsetWidth / 2 + vw() * 0.06;

        /* reduced motion: show the end state (empty stage + info), nothing animates */
        if (!IGNORE_REDUCED_MOTION && reduce) {
          gsap.set([backWrap, frontWrap, imageWrap], { autoAlpha: 0 });
          gsap.set(copyItems, { opacity: 1, y: 0 });
          gsap.set(lines, { yPercent: 0 });
          gsap.set(rule, { scaleX: 1 });
          return;
        }

        /* the about info stays hidden until the user scrolls into it */
        gsap.set(copyItems, { opacity: 0, y: 90 });
        gsap.set(lines, { yPercent: 115 });
        gsap.set(rule, { scaleX: 0, transformOrigin: "center center" });

        /* ---------- 1. ENTRY: face + word reveal while the section scrolls in ---------- */
        const entry = gsap.timeline({
          defaults: { ease: "power2.out" },
          scrollTrigger: {
            trigger: section,
            start: "top 90%",
            end: "top top",
            scrub: 1,
          },
        });

        entry
          .fromTo(
            image,
            { yPercent: 12, scale: 1.14, clipPath: "inset(100% 0% 0% 0%)" },
            { yPercent: 0, scale: 1, clipPath: "inset(0% 0% 0% 0%)", duration: 1 },
            0,
          )
          .fromTo(
            q("[data-letter='back']"),
            { yPercent: 105 },
            { yPercent: 0, duration: 0.7, stagger: 0.045, ease: "power3.out" },
            0.05,
          )
          .fromTo(
            q("[data-letter='front']"),
            { yPercent: 105 },
            { yPercent: 0, duration: 0.7, stagger: 0.045, ease: "power3.out" },
            0.25,
          );

        /* ---------- 2. PINNED: word exits LEFT, face exits RIGHT, info rises ---------- */
        const tl = gsap.timeline({
          scrollTrigger: {
            trigger: section,
            start: "top top",
            end: "bottom bottom",
            scrub: 1,
            invalidateOnRefresh: true,
          },
        });

        /* hold: face + word sit alone first */
        tl.to({}, { duration: 0.12 });

        /* the exit. both start slowly and pick up speed as they leave the frame.
           the outline layer travels a bit further than the filled one, so the two
           layers pull apart and the face reads as sitting between them */
        tl.to(backWrap, { x: wordOut, ease: "power2.in", duration: 0.5 }, 0.12);
        tl.to(
          frontWrap,
          { x: () => wordOut() - vw() * 0.08, ease: "power2.in", duration: 0.5 },
          0.12,
        );
        tl.to(imageWrap, { x: imageOut, ease: "power2.in", duration: 0.5 }, 0.12);
        tl.to(image, { scale: 0.92, ease: "power2.in", duration: 0.5 }, 0.12);

        /* the information, only as the stage clears: rule draws from the centre,
           lines slide up out of their masks, the rest rises and fades in */
        tl.to(rule, { scaleX: 1, duration: 0.22, ease: "power2.inOut" }, 0.5);
        tl.to(
          lines,
          { yPercent: 0, duration: 0.3, stagger: 0.07, ease: "power3.out" },
          0.52,
        );
        tl.to(
          copyItems,
          { opacity: 1, y: 0, duration: 0.32, stagger: 0.08, ease: "power3.out" },
          0.52,
        );

        /* hold the final state while the section unpins */
        tl.to({}, { duration: 0.16 });
      },
      section,
    );

    return () => mm.revert();
  }, []);

  return (
    <section id="about" ref={sectionRef} className="relative h-[340vh] px-6 md:px-12">
      <div className="sticky top-0 flex h-screen items-center overflow-hidden">
        <div className="relative mx-auto w-full max-w-7xl">
          <div className="relative flex min-h-[78vh] items-center justify-center">
            {/* BACK word: bright filled, sits behind the face */}
            <div
              data-word-wrap="back"
              aria-hidden="true"
              className="pointer-events-none absolute inset-0 z-0 flex items-center justify-center will-change-transform"
            >
              <span ref={measureRef} className="inline-flex">
                <Word layer="back" />
              </span>
            </div>

            {/* Face */}
            <div
              ref={imageWrapRef}
              data-image-wrap
              className="relative z-10 w-[min(62vw,400px)] will-change-transform"
            >
              <div
                data-image
                className="relative will-change-transform"
                style={{
                  WebkitMaskImage: "linear-gradient(to bottom, #000 72%, transparent 100%)",
                  maskImage: "linear-gradient(to bottom, #000 72%, transparent 100%)",
                }}
              >
                <Image
                  src="/daniel.png"
                  alt="Daniel"
                  width={750}
                  height={908}
                  className="h-auto w-full object-cover"
                />
              </div>
            </div>

            {/* FRONT word: outline, crosses over the face */}
            <div
              data-word-wrap="front"
              aria-hidden="true"
              className="pointer-events-none absolute inset-0 z-20 flex items-center justify-center will-change-transform"
            >
              <Word layer="front" />
            </div>

            {/* About info: centred, hidden until the stage has cleared */}
            <div
              data-copy
              className="absolute inset-0 z-30 flex flex-col items-center justify-center px-2 text-center"
            >
              <p
                data-copy-item
                className="font-mono text-[10px] uppercase tracking-[0.32em] text-foreground/45"
              >
                04 / About
              </p>

              <div
                data-rule
                className="mt-5 h-px w-full max-w-xs bg-[var(--grid-line)]"
              />

              <div className="mt-6 overflow-hidden py-2">
                <h2
                  data-copy-line
                  className="text-[clamp(2.4rem,8vw,7rem)] font-black leading-[0.92] tracking-[-0.055em] text-foreground"
                >
                  Daniel Eli
                </h2>
              </div>

              <p
                data-copy-item
                className="mt-5 max-w-md text-base leading-relaxed text-foreground/65 md:text-lg"
              >
                Creative developer and designer crafting immersive digital experiences with
                motion, detail, and purpose.
              </p>

              <p
                data-copy-item
                className="mt-7 flex gap-3 font-mono text-[10px] uppercase tracking-[0.32em] text-foreground/45"
              >
                <span>Designer</span>
              </p>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}