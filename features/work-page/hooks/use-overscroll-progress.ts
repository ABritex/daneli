import { useCallback, useEffect, useMemo, useRef } from "react";

const OVERSCROLL = 2200;

export function useOverscrollProgress({
    trackRef,
    spiralRef,
    spiralSvgRef,
    hintRef,
    enabled,
    resetKey,
    onNext,
}: {
    trackRef: React.RefObject<HTMLDivElement | null>;
    spiralRef: React.RefObject<SVGPathElement | null>;
    spiralSvgRef: React.RefObject<SVGSVGElement | null>;
    hintRef: React.RefObject<HTMLSpanElement | null>;
    enabled: boolean;
    resetKey?: unknown;
    onNext: () => void;
}) {
    const overRef = useRef(0);
    const lastOverRef = useRef(0);
    const firedRef = useRef(false);
    const lenRef = useRef(0);
    const onNextRef = useRef(onNext);

    useEffect(() => {
        onNextRef.current = onNext;
    }, [onNext]);

    useEffect(() => {
        const path = spiralRef.current;
        const len = path?.getTotalLength() ?? 0;
        lenRef.current = len;
        overRef.current = 0;
        lastOverRef.current = 0;
        firedRef.current = false;
        if (path) {
            path.style.strokeDasharray = String(len);
            path.style.strokeDashoffset = String(len);
        }
        if (spiralSvgRef.current) spiralSvgRef.current.style.transform = "";
        if (hintRef.current) hintRef.current.style.opacity = "0.5";
    }, [trackRef, spiralRef, spiralSvgRef, hintRef, enabled, resetKey]);

    const push = useCallback(
        (amount: number) => {
            if (!enabled || firedRef.current) return;
            overRef.current = Math.min(OVERSCROLL, overRef.current + amount);
            lastOverRef.current = performance.now();
        },
        [enabled],
    );

    const resetOver = useCallback(() => {
        overRef.current = 0;
    }, []);

    const update = useCallback(
        (dt: number) => {
            if (firedRef.current) return;
            if (overRef.current > 0 && performance.now() - lastOverRef.current > 300) {
                overRef.current = Math.max(0, overRef.current - dt * 1800);
            }
            const p = overRef.current / OVERSCROLL;
            const path = spiralRef.current;
            if (path) path.style.strokeDashoffset = String(lenRef.current * (1 - p));
            if (spiralSvgRef.current) {
                spiralSvgRef.current.style.transform = `rotate(${p * 300}deg) scale(${1 + p * 0.3})`;
            }
            if (hintRef.current) hintRef.current.style.opacity = String(0.5 + p * 0.5);
            if (p >= 1 && !firedRef.current) {
                firedRef.current = true;
                onNextRef.current();
            }
        },
        [spiralRef, spiralSvgRef, hintRef],
    );

    return useMemo(() => ({ push, resetOver, update, firedRef }), [push, resetOver, update]);
}
