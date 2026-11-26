import { useEffect } from "react";
import { clamp, damp } from "@/lib/animations";
import { MQ_DESKTOP_768, MQ_REDUCED_MOTION, mediaMatches } from "@/lib/media";

const MAX_BLUR = 5;

type PopUpdater = {
    update: (horizontal: boolean, vw: number, vh: number, reduceMotion: boolean) => void;
};

type OverscrollUpdater = {
    push: (amount: number) => void;
    resetOver: () => void;
    update: (dt: number) => void;
    firedRef: React.RefObject<boolean>;
};

export function useSmoothHorizontalScroll({
    trackRef,
    enabled,
    hasNext,
    pop,
    overscroll,
}: {
    trackRef: React.RefObject<HTMLDivElement | null>;
    enabled: boolean;
    hasNext: boolean;
    pop: PopUpdater;
    overscroll: OverscrollUpdater;
}) {
    useEffect(() => {
        const el = trackRef.current;
        if (!el) return;

        el.scrollLeft = 0;
        el.scrollTop = 0;

        const mq = window.matchMedia(MQ_DESKTOP_768);
        const isH = () => mq.matches;

        const reduceMotion = mediaMatches(MQ_REDUCED_MOTION);
        let target = 0;
        let current = 0;
        let velocity = 0;
        let blurAmount = 0;
        let raf = 0;
        let lastTime = performance.now();

        const max = () => (isH() ? Math.max(0, el.scrollWidth - el.clientWidth) : Math.max(0, el.scrollHeight - el.clientHeight));
        const onMq = () => {
            target = current = el.scrollLeft;
        };
        mq.addEventListener("change", onMq);
        const clampTarget = () => {
            target = clamp(target, 0, max());
        };

        const onWheel = (e: WheelEvent) => {
            if (!isH()) {
                if (!hasNext || overscroll.firedRef.current) return;
                if (e.deltaY > 0 && el.scrollTop >= max() - 1) overscroll.push(e.deltaY);
                else if (e.deltaY < 0) overscroll.resetOver();
                return;
            }
            if (Math.abs(e.deltaY) <= Math.abs(e.deltaX) && Math.abs(e.deltaX) === 0) return;
            e.preventDefault();
            if (overscroll.firedRef.current) return;
            const delta = Math.abs(e.deltaX) > Math.abs(e.deltaY) ? e.deltaX : e.deltaY;
            if (hasNext && delta > 0 && target >= max() - 1) overscroll.push(delta);
            else if (delta < 0) overscroll.resetOver();
            target += delta * 0.9;
            clampTarget();
        };

        let tx = 0;
        let ty = 0;
        const onTouchStart = (e: TouchEvent) => {
            tx = e.touches[0].clientX;
            ty = e.touches[0].clientY;
        };
        const onTouchMove = (e: TouchEvent) => {
            const x = e.touches[0].clientX;
            const y = e.touches[0].clientY;
            const dx = tx - x;
            const dy = ty - y;
            tx = x;
            ty = y;
            if (!hasNext || overscroll.firedRef.current) return;
            if (isH()) {
                if (dx > 0 && el.scrollLeft >= max() - 1) overscroll.push(dx * 3);
            } else if (dy > 0 && el.scrollTop >= max() - 1) overscroll.push(dy * 3);
        };

        const onScroll = () => {
            if (!isH()) return;
            if (Math.abs(el.scrollLeft - current) > 1) {
                target = el.scrollLeft;
                current = el.scrollLeft;
            }
        };

        const tick = (time: number) => {
            const dt = Math.min((time - lastTime) / 1000, 0.05);
            lastTime = time;

            const horizontal = isH();
            if (horizontal) {
                clampTarget();
                const prev = current;
                const ease = reduceMotion ? 1 : damp(5.5, dt);
                current += (target - current) * ease;

                if (Math.abs(target - current) < 0.5) current = target;
                el.scrollLeft = current;

                const rawVelocity = (current - prev) / Math.max(dt, 0.001);
                velocity += (rawVelocity - velocity) * damp(8, dt);
            } else {
                velocity = 0;
            }
            const targetBlur = reduceMotion ? 0 : Math.min(MAX_BLUR, Math.abs(velocity) / 1400);
            blurAmount += (targetBlur - blurAmount) * damp(10, dt);
            el.style.setProperty("--mb", blurAmount > 0.1 ? `${blurAmount.toFixed(2)}px` : "0px");

            const vw = el.clientWidth;
            const vh = el.clientHeight;
            pop.update(horizontal, vw, vh, reduceMotion);
            overscroll.update(dt);

            raf = window.requestAnimationFrame(tick);
        };

        el.addEventListener("wheel", onWheel, { passive: false });
        el.addEventListener("scroll", onScroll, { passive: true });
        el.addEventListener("touchstart", onTouchStart, { passive: true });
        el.addEventListener("touchmove", onTouchMove, { passive: true });
        raf = window.requestAnimationFrame(tick);
        return () => {
            mq.removeEventListener("change", onMq);
            el.removeEventListener("wheel", onWheel);
            el.removeEventListener("scroll", onScroll);
            el.removeEventListener("touchstart", onTouchStart);
            el.removeEventListener("touchmove", onTouchMove);
            window.cancelAnimationFrame(raf);
            el.style.removeProperty("--mb");
        };
    }, [trackRef, enabled, hasNext, pop, overscroll]);
}
