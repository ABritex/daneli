"use client";

import { useEffect, useRef } from "react";
import { gsap } from "@/lib/gsap";
import { TextGenerateEffect } from "@/components/effects";

type FeaturedTitleVariant = "reveal" | "proximity" | "hybrid" | "wave" | "scramble" | "blur";

export function FeaturedTitle({ text = "Featured Work", variant = "reveal", className = "" }: { text?: string; variant?: FeaturedTitleVariant; className?: string }) {
    const revealRef = useRef<HTMLDivElement>(null);

    useEffect(() => {
        if (variant !== "reveal") return;
        const el = revealRef.current;
        if (!el) return;

        const tl = gsap.timeline({
            scrollTrigger: {
                trigger: el,
                start: "top 85%",
                once: true,
            },
        });

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
    }, [text, variant]);

    return (
        <div className={`relative inline-block display-heading ${className}`}>
            <TextGenerateEffect ref={revealRef} words={text} className="relative z-10 display-heading text-foreground" filter={true} duration={0.6} />
        </div>
    );
}
