import { useCallback, useEffect, useMemo } from "react";

const c01 = (v: number) => Math.max(0, Math.min(1, v));

export function usePopOnScroll(trackRef: React.RefObject<HTMLDivElement | null>, enabled: boolean) {
    useEffect(() => {
        const el = trackRef.current;
        if (!el || !enabled) return;
        return () => {
            el.querySelectorAll<HTMLElement>("[data-pop]").forEach((pop) => {
                pop.style.transform = "";
                pop.style.opacity = "";
            });
        };
    }, [trackRef, enabled]);

    const update = useCallback(
        (horizontal: boolean, vw: number, vh: number, reduceMotion: boolean) => {
            const el = trackRef.current;
            if (!el) return;
            for (const pop of el.querySelectorAll<HTMLElement>("[data-pop]")) {
                const r = (pop.parentElement as HTMLElement).getBoundingClientRect();
                const kIn = reduceMotion ? 1 : horizontal ? c01((vw - r.left) / (vw * 0.45)) : c01((vh - r.top) / (vh * 0.35));
                const kOut = reduceMotion ? 1 : horizontal ? c01(r.right / (vw * 0.3)) : c01(r.bottom / (vh * 0.25));
                const eIn = 1 - Math.pow(1 - kIn, 3);
                const m = Math.min(eIn, 0.5 + 0.5 * kOut);
                pop.style.transform = `translate3d(0, ${(1 - eIn) * 70}px, 0) scale(${0.8 + 0.2 * m})`;
                pop.style.opacity = String(0.15 + 0.85 * m);
            }
        },
        [trackRef],
    );

    return useMemo(() => ({ update }), [update]);
}
