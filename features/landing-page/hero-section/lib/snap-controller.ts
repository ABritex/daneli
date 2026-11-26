import { GLIDE_MS, SNAP_P, WHEEL_HOLD_MAX_MS, WHEEL_QUIET_MS } from "../config/config";
import type { LenisLike } from "../config/types";
import { clamp } from "./utils";

export type SnapState = {
    gliding: boolean;
    glideFrame: number;
    lastBeyond: number;
    wasBeyond: boolean;
    cooldownUntil: number;
    lastWheelAt: number;
    holdWheel: boolean;
    holdUntil: number;
    touching: boolean;
    lastMoveAt: number;
};

export function createSnapState(): SnapState {
    return {
        gliding: false,
        glideFrame: 0,
        lastBeyond: 0,
        wasBeyond: false,
        cooldownUntil: 0,
        lastWheelAt: 0,
        holdWheel: false,
        holdUntil: 0,
        touching: false,
        lastMoveAt: performance.now(),
    };
}

type SnapDeps = {
    wrapper: HTMLDivElement;
    getReduceMotion: () => boolean;
    getCoarsePointer: () => boolean;
    isDisposed: () => boolean;
};

export function createSnapController(state: SnapState, deps: SnapDeps) {
    const metrics = () => {
        const rect = deps.wrapper.getBoundingClientRect();
        const range = Math.max(deps.wrapper.offsetHeight - window.innerHeight, 1);
        return {
            rectTop: rect.top,
            rectBottom: rect.bottom,
            top: rect.top + window.scrollY,
            range,
            p: clamp(-rect.top / range, 0, 1),
        };
    };

    const glideTo = (targetP: number) => {
        if (state.gliding) return;
        const m = metrics();
        const from = window.scrollY;
        const to = m.top + targetP * m.range;
        state.gliding = true;
        const done = () => {
            state.gliding = false;
            const t = performance.now();
            state.cooldownUntil = t + 400;
            state.holdWheel = true;
            state.holdUntil = t + WHEEL_HOLD_MAX_MS;
        };
        const lenis = (window as unknown as { __lenis?: LenisLike }).__lenis;
        const start = performance.now();
        const step = (now: number) => {
            if (deps.isDisposed()) return;
            const x = clamp((now - start) / GLIDE_MS, 0, 1);
            const e = 0.5 - 0.5 * Math.cos(Math.PI * x);
            const y = from + (to - from) * e;
            if (lenis) lenis.scrollTo(y, { immediate: true, force: true });
            else window.scrollTo({ top: y, behavior: "instant" as ScrollBehavior });
            if (x < 1) {
                state.glideFrame = window.requestAnimationFrame(step);
            } else {
                done();
            }
        };
        state.glideFrame = window.requestAnimationFrame(step);
    };

    const cancelGlide = () => {
        if (!state.gliding) return;
        state.gliding = false;
        window.cancelAnimationFrame(state.glideFrame);
        state.glideFrame = 0;
    };

    const decide = (dir: 1 | -1): boolean => {
        if (deps.getReduceMotion() || deps.getCoarsePointer() || state.gliding) return false;
        if (document.documentElement.dataset.loader === "playing") return false;
        const m = metrics();
        if (dir > 0 && m.rectTop <= 2 && m.p < SNAP_P - 0.004) {
            glideTo(SNAP_P);
            return true;
        }
        if (dir < 0 && m.rectTop <= 2 && m.rectBottom >= window.innerHeight - 2 && m.p > 0.002 && m.p < SNAP_P - 0.004) {
            if (performance.now() - state.lastBeyond > 350) {
                glideTo(0);
                return true;
            }
        }
        return false;
    };

    const onWheel = (e: WheelEvent) => {
        if (deps.getReduceMotion()) return;
        const now = performance.now();
        const quiet = now - state.lastWheelAt;
        state.lastWheelAt = now;
        if (document.documentElement.dataset.loader === "playing") return;
        if (state.gliding) {
            e.preventDefault();
            e.stopImmediatePropagation();
            state.cooldownUntil = Math.max(state.cooldownUntil, now + 400);
            return;
        }
        if (state.holdWheel) {
            if (quiet > WHEEL_QUIET_MS || now > state.holdUntil) {
                state.holdWheel = false;
            } else {
                e.preventDefault();
                e.stopImmediatePropagation();
                return;
            }
        }
        if (now < state.cooldownUntil) {
            const dir = e.deltaY > 0 ? 1 : -1;
            const m = metrics();
            const reversingUp = dir < 0 && m.p >= SNAP_P - 0.02;
            if (reversingUp) {
                e.preventDefault();
                e.stopImmediatePropagation();
            }
            return;
        }
        if (Math.abs(e.deltaY) < 4) return;
        if (decide(e.deltaY > 0 ? 1 : -1)) {
            e.preventDefault();
            e.stopImmediatePropagation();
        }
    };

    const onTouchStart = () => {
        cancelGlide();
        state.touching = true;
    };
    const onTouchCancel = () => {
        state.touching = false;
    };
    const onTouchEnd = () => {
        state.touching = false;
    };
    const onKey = (e: KeyboardEvent) => {
        if (deps.getReduceMotion() || e.defaultPrevented) return;
        const t = e.target as HTMLElement | null;
        if (t && (t.isContentEditable || /^(INPUT|TEXTAREA|SELECT)$/.test(t.tagName))) return;
        const down = e.key === "ArrowDown" || e.key === "PageDown" || e.key === " ";
        const up = e.key === "ArrowUp" || e.key === "PageUp";
        if (!down && !up) return;
        if (state.gliding) {
            e.preventDefault();
            return;
        }
        if (decide(down ? 1 : -1)) e.preventDefault();
    };

    return { metrics, glideTo, cancelGlide, decide, onWheel, onTouchStart, onTouchCancel, onTouchEnd, onKey };
}
