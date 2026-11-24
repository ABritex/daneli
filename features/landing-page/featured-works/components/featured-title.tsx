"use client";

import { useEffect, useRef } from "react";
import { gsap } from "gsap";
import { ScrollTrigger } from "gsap/ScrollTrigger";
import { TextGenerateEffect, VariableProximity } from "@/components/effects";

gsap.registerPlugin(ScrollTrigger);

type FeaturedTitleVariant =
  | "reveal"
  | "proximity"
  | "hybrid"
  | "wave"
  | "scramble"
  | "blur";

export function FeaturedTitle({
  text = "Featured Work",
  variant = "hybrid",
  className = "",
}: {
  text?: string;
  variant?: FeaturedTitleVariant;
  className?: string;
}) {
  const revealRef = useRef<HTMLDivElement>(null);
  const words = text.split(" ");
  const showReveal = variant === "reveal" || variant === "hybrid";
  const showProximity = variant === "proximity" || variant === "hybrid";
  const showWave = variant === "wave" || variant === "hybrid";
  const showScramble = variant === "scramble";
  const showBlur = variant === "blur";

  useEffect(() => {
    const el = revealRef.current;
    if (!el) return;

    const tl = gsap.timeline({
      scrollTrigger: {
        trigger: el,
        start: "top 85%",
        once: true,
      },
    });

    // Individual word reveal with staggered y-offset + scale
    tl.fromTo(
      el.querySelectorAll("span"),
      {
        yPercent: 120,
        scale: 0.8,
        opacity: 0,
        filter: "blur(12px)",
      },
      {
        yPercent: 0,
        scale: 1,
        opacity: 1,
        filter: "blur(0px)",
        duration: 0.9,
        ease: "power3.out",
        stagger: 0.12,
      },
    );

    return () => {
      tl.scrollTrigger?.kill();
      tl.kill();
    };
  }, [text]);

  return (
    <div className={`relative inline-block font-monument uppercase ${className}`}>
      {/* Word-by-word scroll reveal with scale + blur */}
      {showReveal && (
        <TextGenerateEffect
          ref={revealRef}
          words={text}
          className="relative z-10 font-monument font-bold tracking-normal text-foreground"
          filter={true}
          duration={0.6}
        />
      )}

      {/* Wave: letters undulate vertically on scroll */}
      {showWave && (
        <div className="relative z-10 font-monument font-bold tracking-normal text-foreground">
          {words.map((word, wi) => (
            <span key={`wave-w-${wi}`} className="inline-block whitespace-nowrap">
              {word.split("").map((letter, li) => (
                <span
                  key={`wave-l-${wi}-${li}`}
                  className="inline-block animate-wave"
                  style={{ animationDelay: `${(wi + li * 0.05) * 0.2}s` }}
                >
                  {letter}
                </span>
              ))}
              {wi < words.length - 1 && <span className="inline-block">&nbsp;</span>}
            </span>
          ))}
        </div>
      )}

      {/* Scramble: letters randomize then resolve on hover */}
      {showScramble && (
        <div className="relative z-10 font-monument font-bold tracking-normal text-foreground group">
          {words.map((word, wi) => (
            <span key={`scram-w-${wi}`} className="inline-block whitespace-nowrap">
              {word.split("").map((letter, li) => (
                <span
                  key={`scram-l-${wi}-${li}`}
                  className="inline-block transition-all duration-300"
                  onMouseEnter={(e) => {
                    const tgt = e.currentTarget;
                    const orig = letter;
                    let frame = 0;
                    const glyphs = "ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789";
                    const id = setInterval(() => {
                      tgt.textContent =
                        glyphs[Math.floor(Math.random() * glyphs.length)];
                      frame += 1;
                      if (frame > 6) {
                        clearInterval(id);
                        tgt.textContent = orig;
                      }
                    }, 40);
                  }}
                >
                  {letter}
                </span>
              ))}
              {wi < words.length - 1 && <span className="inline-block">&nbsp;</span>}
            </span>
          ))}
        </div>
      )}

      {/* Blur: text sharpens as it comes into view */}
      {showBlur && (
        <div className="relative z-10 font-monument font-bold tracking-normal text-foreground">
          {words.map((word, wi) => (
            <span key={`blur-w-${wi}`} className="inline-block whitespace-nowrap">
              {word.split("").map((letter, li) => (
                <span
                  key={`blur-l-${wi}-${li}`}
                  className="inline-block"
                  style={{
                    filter: "blur(8px)",
                    transition: `filter 0.8s ease ${(wi + li * 0.03) * 0.15}s`,
                  }}
                  onMouseEnter={(e) => {
                    e.currentTarget.style.filter = "blur(0px)";
                  }}
                  onMouseLeave={(e) => {
                    e.currentTarget.style.filter = "blur(8px)";
                  }}
                >
                  {letter}
                </span>
              ))}
              {wi < words.length - 1 && <span className="inline-block">&nbsp;</span>}
            </span>
          ))}
        </div>
      )}

      {/* Mouse-reactive proximity distortion */}
      {showProximity && (
        <VariableProximity
          label={text}
          className="absolute inset-0 z-20 pointer-events-none select-none"
          fromFontVariationSettings="'wght' 400, 'wdth' 100"
          toFontVariationSettings="'wght' 900, 'wdth' 125"
          radius={140}
          falloff="gaussian"
          smoothing={0.12}
          scale={1.2}
          lift={-0.2}
          idleWave={true}
          fontSize="clamp(3rem, 8vw, 7.5rem)"
        />
      )}

    </div>
  );
}

export default FeaturedTitle;
