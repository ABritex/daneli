"use client";

import Image from "next/image";
import { useRef, useState } from "react";
import { Highlighter } from "@/components/ui/highlighter";
import { PortfolioWord } from "./components/portfolio-word";
import { useAboutAnimation } from "./hooks/use-about-animation";

export function AboutSection() {
  const sectionRef = useRef<HTMLElement>(null);
  const measureRef = useRef<HTMLSpanElement>(null);
  const imageWrapRef = useRef<HTMLDivElement>(null);
  const [copyDone, setCopyDone] = useState(false);

  useAboutAnimation({ sectionRef, measureRef, imageWrapRef, setCopyDone });

  return (
    <section id="about" ref={sectionRef} className="relative h-[400vh]">
      <div data-stage className="sticky top-0 isolate flex h-dvh items-center overflow-hidden opacity-0">
        <div className="relative mx-auto w-full max-w-7xl">
          <div className="relative flex min-h-[78dvh] items-center justify-center">
            {/* back word, sits behind daniel */}
            <div
              data-word-wrap="back"
              aria-hidden="true"
              className="pointer-events-none absolute inset-0 z-0 flex items-center justify-center will-change-transform"
            >
              <span ref={measureRef} className="inline-flex shrink-0">
                <PortfolioWord layer="back" />
              </span>
            </div>

            {/* daniel image, pinned to bottom of the sticky stage */}
            <div className="pointer-events-none absolute inset-x-0 -bottom-[12vh] z-10 flex justify-center">
              <div
                ref={imageWrapRef}
                data-image-wrap
                className="relative aspect-[1526/1892] h-[min(96svh,calc(96vw*1.2398))] shrink-0 will-change-transform"
              >
                <div
                  data-image
                  className="relative h-full w-full will-change-transform"
                  style={{ transformOrigin: "50% 100%" }}
                >
                  <Image
                    src="/daniel.png"
                    alt="Daniel"
                    width={1526}
                    height={1892}
                    loading="lazy"
                    fetchPriority="low"
                    sizes="(max-width: 768px) 92vw, 720px"
                    className="h-full w-full object-contain object-bottom"
                  />
                </div>
              </div>
            </div>

            {/* front outline word, goes over the image */}
            <div
              data-word-wrap="front"
              aria-hidden="true"
              className="pointer-events-none absolute inset-0 z-20 flex items-center justify-center will-change-transform"
            >
              <PortfolioWord layer="front" />
            </div>

            {/* the actual about copy */}
            <div
              data-copy
              className="absolute inset-0 z-30 grid grid-cols-12 content-center gap-x-6 px-6 text-left md:px-12"
            >
              <div className="col-span-12 md:col-span-8 md:col-start-4">
                <p
                  data-copy-item
                  className="mb-6 font-mono text-[11px] uppercase tracking-[0.32em] text-foreground/55"
                >
                  <Highlighter
                    action="underline"
                    color="rgba(230,229,224,0.45)"
                    strokeWidth={1}
                    iterations={1}
                    animationDuration={600}
                    active={copyDone}
                  >
                    Elijah Daniel V. Reyes
                  </Highlighter>
                </p>

                <p
                  data-copy-item
                  className="text-balance text-[clamp(1.15rem,2.35vw,2.5rem)] font-semibold leading-[1.18] tracking-[-0.03em] text-foreground"
                >
                  <span className="text-foreground/40">I am a </span>
                  <Highlighter
                    action="highlight"
                    color="rgba(230,229,224,0.2)"
                    iterations={1}
                    animationDuration={700}
                    active={copyDone}
                  >
                    creative generalist
                  </Highlighter>{" "}
                  <span className="text-foreground/40">who creates </span>
                  <Highlighter
                    action="underline"
                    color="rgba(230,229,224,0.35)"
                    strokeWidth={1.5}
                    iterations={1}
                    animationDuration={650}
                    active={copyDone}
                  >
                    3D Design, Motion Graphics, Visual Effects, Cinematography &amp; Videography
                  </Highlighter>{" "}
                  <span className="text-foreground/40">for/about </span>
                  <Highlighter
                    action="highlight"
                    color="rgba(230,229,224,0.12)"
                    iterations={1}
                    animationDuration={650}
                    active={copyDone}
                  >
                    entertainment like music videos, short-form content, marketing/advertisements, &amp; animation
                  </Highlighter>{" "}
                  <span className="text-foreground/40">through </span>
                  <Highlighter
                    action="underline"
                    color="rgba(230,229,224,0.3)"
                    strokeWidth={1}
                    iterations={1}
                    animationDuration={600}
                    active={copyDone}
                  >
                    Autodesk Maya, Adobe After Effects, Adobe Premiere Pro, Davinci Resolve, &amp; Sony cameras
                  </Highlighter>
                  .
                </p>
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
