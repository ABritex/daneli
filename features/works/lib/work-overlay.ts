import { PAGE_BG, WORK_MEDIA_ATTR, WORK_OVERLAY_ATTR, WORK_TRANSITIONING_ATTR } from "../constants";

export type Rect = { left: number; top: number; width: number; height: number };
export type Overlay = { el: HTMLDivElement; layer: HTMLDivElement };

const OVERLAY_Z = "39"; // above card canvas, below site header

export const fullRect = (): Rect => ({
  left: 0,
  top: 0,
  width: window.innerWidth,
  height: window.innerHeight,
});

export function makeOverlay(
  o: { poster: string; video: string; time?: number },
  r: Rect,
  radius: string,
  layerOpacity: number,
  layerScale: number,
): Overlay {
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

export const clearCardTransitionState = () => {
  document
    .querySelectorAll<HTMLElement>(`[data-work][${WORK_TRANSITIONING_ATTR}]`)
    .forEach((card) => card.removeAttribute(WORK_TRANSITIONING_ATTR));
  document.querySelectorAll<HTMLElement>(`#work [${WORK_MEDIA_ATTR}]`).forEach((media) => {
    media.style.visibility = "";
  });
};
