"use client";

import { useEffect, useRef } from "react";
import { mediaMatches } from "@/lib/media";

const GRAIN_SVG =
    "<svg xmlns='http://www.w3.org/2000/svg' width='180' height='180'><filter id='n'><feTurbulence type='fractalNoise' baseFrequency='.85' numOctaves='2' stitchTiles='stitch'/><feColorMatrix values='0 0 0 0 0  0 0 0 0 0  0 0 0 0 0  0 0 0 .55 0'/></filter><rect width='100%' height='100%' filter='url(#n)'/></svg>";
const GRAIN_URL = `url("data:image/svg+xml,${encodeURIComponent(GRAIN_SVG)}")`;

export function GrainOverlay() {
    const ref = useRef<HTMLDivElement>(null);

    useEffect(() => {
        const el = ref.current;
        if (!el) return;

        const interval = mediaMatches("(max-width: 768px)") ? 160 : 80;
        let raf = 0;
        let last = 0;
        const tick = (now: number) => {
            raf = window.requestAnimationFrame(tick);
            if (document.hidden) return;
            if (now - last > interval) {
                el.style.backgroundPosition = `${Math.random() * 180}px ${Math.random() * 180}px`;
                last = now;
            }
        };
        raf = window.requestAnimationFrame(tick);
        return () => window.cancelAnimationFrame(raf);
    }, []);

    return (
        <div
            ref={ref}
            aria-hidden="true"
            style={{
                position: "fixed",
                inset: 0,
                zIndex: 60,
                pointerEvents: "none",
                backgroundImage: GRAIN_URL,
                opacity: 0.22,
                mixBlendMode: "multiply",
            }}
        />
    );
}
