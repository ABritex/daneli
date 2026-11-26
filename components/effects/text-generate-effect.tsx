"use client";

import { forwardRef, useEffect, useRef } from "react";
import { cn } from "@/lib/utils";

export interface TextGenerateEffectProps {
    words: string;
    className?: string;
    filter?: boolean;
    duration?: number;
}

const TextGenerateEffect = forwardRef<HTMLDivElement, TextGenerateEffectProps>(({ words, className, filter = true, duration = 0.5 }, ref) => {
    const scopeRef = useRef<HTMLDivElement>(null);
    const wordElsRef = useRef<HTMLSpanElement[]>([]);
    const animatedRef = useRef(false);

    useEffect(() => {
        if (animatedRef.current) return;
        animatedRef.current = true;

        const wordsArray = words.split(" ");
        const els = scopeRef.current?.querySelectorAll("span") ?? [];
        els.forEach((el, i) => {
            const word = wordsArray[i];
            if (!word) return;
            const span = el as HTMLSpanElement;
            span.style.opacity = "0";
            span.style.filter = filter ? "blur(10px)" : "none";
            span.style.transition = `opacity ${duration}s ease, filter ${duration}s ease`;
            span.style.transitionDelay = `${i * 0.2}s`;

            // Trigger reflow then animate
            requestAnimationFrame(() => {
                span.style.opacity = "1";
                span.style.filter = filter ? "blur(0px)" : "none";
            });
        });
    }, [words, filter, duration]);

    const wordsArray = words.split(" ");

    return (
        <div ref={ref} className={cn("font-bold", className)}>
            <div className="mt-4">
                <div ref={scopeRef} className="text-foreground text-2xl leading-snug tracking-wide">
                    {wordsArray.map((word, idx) => (
                        <span
                            key={word + idx}
                            ref={(el) => {
                                if (el) wordElsRef.current[idx] = el;
                            }}
                            style={{
                                filter: filter ? "blur(10px)" : "none",
                            }}
                        >
                            {word}{" "}
                        </span>
                    ))}
                </div>
            </div>
        </div>
    );
});

TextGenerateEffect.displayName = "TextGenerateEffect";

export default TextGenerateEffect;
