import { useEffect } from "react";
import { gsap } from "gsap";

export function useRevealOnScroll(trackRef: React.RefObject<HTMLDivElement | null>, enabled: boolean) {
    useEffect(() => {
        const el = trackRef.current;
        if (!el || !enabled) return;
        const wraps = Array.from(el.querySelectorAll<HTMLElement>("[data-reveal-word]"));
        const items = Array.from(el.querySelectorAll<HTMLElement>("[data-reveal]"));
        wraps.forEach((w) => gsap.set(w.firstElementChild, { yPercent: 110 }));
        gsap.set(items, { opacity: 0, y: 24 });

        const io = new IntersectionObserver(
            (entries) => {
                for (const e of entries) {
                    if (!e.isIntersecting) continue;
                    const t = e.target as HTMLElement;
                    io.unobserve(t);
                    const i = Number(t.dataset.i ?? 0);
                    if (t.hasAttribute("data-reveal-word")) {
                        gsap.to(t.firstElementChild, { yPercent: 0, duration: 1, ease: "power4.out", delay: i * 0.07 });
                    } else {
                        gsap.to(t, { opacity: 1, y: 0, duration: 0.9, ease: "power3.out", delay: i * 0.08 });
                    }
                }
            },
            { root: el, threshold: 0.35 },
        );
        [...wraps, ...items].forEach((t) => io.observe(t));
        return () => {
            io.disconnect();
            gsap.killTweensOf([...wraps.map((w) => w.firstElementChild), ...items]);
        };
    }, [trackRef, enabled]);
}
