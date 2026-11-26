import { CARD_HOVER_SAMPLE, CARD_SAMPLE, PAGE_BG, WORK_MEDIA_ATTR, WORK_OVERLAY_ATTR, WORK_TRANSITIONING_ATTR } from "../constants";

export type Rect = { left: number; top: number; width: number; height: number };
export type Overlay = { el: HTMLDivElement; layer: HTMLDivElement };

const OVERLAY_Z = "39"; // above card canvas, below site header

/* css scale that reproduces the zoom the home card shows. the overlay is object-fit: cover at the
   card rect, so any card shape works; only the shader zoom has to be matched.
   1 when the card is a plain DOM video (phones, or no WebGL: the video is not hidden then) */
export function cardZoom(media: HTMLElement, hovered: boolean): number {
    const v = media.querySelector<HTMLVideoElement>("video");
    const drawnByGl = !!v && getComputedStyle(v).opacity === "0";
    return drawnByGl ? 1 / (CARD_SAMPLE - (hovered ? CARD_HOVER_SAMPLE : 0)) : 1;
}

export const fullRect = (): Rect => ({
    left: 0,
    top: 0,
    width: window.innerWidth,
    height: window.innerHeight,
});

export function makeOverlay(o: { poster: string; video: string; time?: number }, r: Rect, radius: string, layerOpacity: number, layerScale: number): Overlay {
    const el = document.createElement("div");
    el.setAttribute(WORK_OVERLAY_ATTR, "");
    Object.assign(el.style, {
        position: "fixed",
        left: `${r.left}px`,
        top: `${r.top}px`,
        width: `${r.width}px`,
        height: `${r.height}px`,
        borderRadius: radius,
        overflow: "hidden",
        isolation: "isolate", // keeps rounded clipping correct on the promoted child layer (Safari)
        zIndex: OVERLAY_Z,
        background: PAGE_BG,
        pointerEvents: "none",
        contain: "layout paint",
    });

    const layer = document.createElement("div");
    layer.style.cssText = `position:absolute;inset:0;opacity:${layerOpacity};transform:scale(${layerScale});will-change:transform,opacity`;
    const cover = "position:absolute;inset:0;width:100%;height:100%;object-fit:cover;display:block";

    const img = document.createElement("img");
    img.src = o.poster;
    img.alt = "";
    img.decoding = "async";
    img.style.cssText = cover;
    layer.appendChild(img);

    if (o.video) {
        const v = document.createElement("video");
        v.preload = "auto";
        v.src = o.video;
        v.muted = true;
        v.loop = true;
        v.playsInline = true;
        v.autoplay = true;
        v.style.cssText = `${cover};opacity:0;transition:opacity .25s`;
        v.addEventListener(
            "loadeddata",
            () => {
                if (o.time) v.currentTime = o.time;
                v.style.opacity = "1";
                v.play().catch(() => {});
            },
            { once: true },
        );
        layer.appendChild(v);
    }

    el.appendChild(layer);
    document.body.appendChild(el);
    return { el, layer };
}

export const nextFrames = (n: number) =>
    new Promise<void>((res) => {
        const step = (i: number) => (i <= 0 ? res() : requestAnimationFrame(() => step(i - 1)));
        step(n);
    });

// wait for the card video to have a frame, or give up after maxMs
export const videoReady = (media: HTMLElement, maxMs: number) =>
    new Promise<void>((res) => {
        const v = media.querySelector<HTMLVideoElement>("video");
        const start = performance.now();
        const check = () => {
            if (!v || v.readyState >= 2 || performance.now() - start > maxMs) return res();
            requestAnimationFrame(check);
        };
        check();
    });

// the card video is lazy (preload none, src attached by an observer). on the way back the observer can
// be late, so start loading it ourselves, otherwise the hand-off lands on a card with no frame (black)
export function primeCardVideo(media: HTMLElement) {
    const v = media.querySelector<HTMLVideoElement>("video");
    if (v && !v.getAttribute("src") && v.dataset.src) {
        v.crossOrigin = "anonymous";
        v.src = v.dataset.src;
        v.load();
    }
}

// resolves once the element has stopped moving (scrubbed scroll animations re-run on a fresh mount and
// keep sliding the cards for ~1s), or after maxMs
export const rectSettled = (el: HTMLElement, maxMs: number, stableFrames = 8) =>
    new Promise<void>((res) => {
        const start = performance.now();
        let last = el.getBoundingClientRect();
        let stable = 0;
        const check = () => {
            const r = el.getBoundingClientRect();
            const moved = Math.abs(r.top - last.top) + Math.abs(r.left - last.left) + Math.abs(r.width - last.width);
            stable = moved < 0.5 ? stable + 1 : 0;
            last = r;
            if (stable >= stableFrames || performance.now() - start > maxMs) return res();
            requestAnimationFrame(check);
        };
        requestAnimationFrame(check);
    });

export const clearCardTransitionState = () => {
    document.querySelectorAll<HTMLElement>(`[data-work][${WORK_TRANSITIONING_ATTR}]`).forEach((card) => card.removeAttribute(WORK_TRANSITIONING_ATTR));
    document.querySelectorAll<HTMLElement>(`#work [${WORK_MEDIA_ATTR}]`).forEach((media) => {
        media.style.visibility = "";
    });
};
