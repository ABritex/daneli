"use client";

import { useEffect, useRef, useState } from "react";
import type Lenis from "lenis";

const TRACK_H = 168; // total length of the pill track
const THUMB_H = 44; // length of the moving pill
const TRAVEL = TRACK_H - THUMB_H;

const DRAG_LERP = 0.08; // page glide while dragging (lower = floatier)
const THUMB_RATE_IDLE = 9; // thumb smoothing while following the page
const THUMB_RATE_DRAG = 24; // thumb smoothing while following the pointer

const getLenis = () => (window as unknown as { __lenis?: Lenis }).__lenis;
const clamp01 = (v: number) => Math.min(1, Math.max(0, v));

/**
 * Short vertical scroll pill pinned to the right-centre of the screen.
 * - follows the page scroll (smoothed)
 * - widens on hover / drag
 * - click or drag the track: the thumb tracks the pointer and the page glides to it through Lenis
 * - stays hidden until the loader has finished
 */
export function ScrollPill() {
  const trackRef = useRef<HTMLDivElement>(null);
  const thumbRef = useRef<HTMLDivElement>(null);
  const dragging = useRef(false);
  const dragRatio = useRef<number | null>(null); // pointer position along the track while dragging
  const hovering = useRef(false);
  const [shown, setShown] = useState(false);
  const [active, setActive] = useState(false);

  // appear only after the loader is gone
  useEffect(() => {
    const root = document.documentElement;
    const check = () => setShown(root.dataset.loader === "done" || root.dataset.loader === "skip");
    check();
    const observer = new MutationObserver(check);
    observer.observe(root, { attributes: true, attributeFilter: ["data-loader"] });
    window.addEventListener("daneli-loader-done", check);
    return () => {
      observer.disconnect();
      window.removeEventListener("daneli-loader-done", check);
    };
  }, []);

  // follow scroll position (or the pointer while dragging)
  useEffect(() => {
    if (!shown) return;
    const thumb = thumbRef.current;
    const track = trackRef.current;
    if (!thumb || !track) return;

    let raf = 0;
    let cur = -1;
    let last = performance.now();
    const tick = (now: number) => {
      const dt = Math.min((now - last) / 1000, 0.064);
      last = now;

      const max = document.documentElement.scrollHeight - window.innerHeight;
      const scrollRatio = max > 0 ? clamp01(window.scrollY / max) : 0;
      const target = dragRatio.current ?? scrollRatio;
      const rate = dragRatio.current !== null ? THUMB_RATE_DRAG : THUMB_RATE_IDLE;

      cur = cur < 0 ? target : cur + (target - cur) * (1 - Math.exp(-rate * dt));
      thumb.style.transform = `translateY(${cur * TRAVEL}px)`;
      track.style.opacity = max > 4 ? "1" : "0";
      raf = requestAnimationFrame(tick);
    };
    raf = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(raf);
  }, [shown]);

  const scrollToPointer = (clientY: number) => {
    const track = trackRef.current;
    if (!track) return;
    const rect = track.getBoundingClientRect();
    const ratio = clamp01((clientY - rect.top - THUMB_H / 2) / TRAVEL);
    dragRatio.current = ratio;

    const max = document.documentElement.scrollHeight - window.innerHeight;
    const lenis = getLenis();
    if (lenis) {
      // glide instead of jump: Lenis keeps easing toward the latest target
      lenis.scrollTo(ratio * max, { lerp: DRAG_LERP, force: true });
    } else {
      window.scrollTo({ top: ratio * max, behavior: "auto" });
    }
  };

  const endDrag = () => {
    dragging.current = false;
    dragRatio.current = null;
    setActive(hovering.current);
  };

  return (
    <div
      aria-hidden="true"
      className={`fixed top-1/2 right-0 z-[60] flex w-4 -translate-y-1/2 cursor-pointer justify-center transition-opacity duration-700 md:w-6 ${
        shown ? "opacity-100" : "pointer-events-none opacity-0"
      }`}
      style={{ height: TRACK_H, touchAction: "none" }}
      onPointerDown={(e) => {
        e.currentTarget.setPointerCapture(e.pointerId);
        dragging.current = true;
        setActive(true);
        scrollToPointer(e.clientY);
      }}
      onPointerMove={(e) => {
        if (dragging.current) scrollToPointer(e.clientY);
      }}
      onPointerUp={endDrag}
      onPointerCancel={endDrag}
      onPointerEnter={() => {
        hovering.current = true;
        setActive(true);
      }}
      onPointerLeave={() => {
        hovering.current = false;
        if (!dragging.current) setActive(false);
      }}
    >
      <div
        ref={trackRef}
        className={`relative h-full rounded-full bg-foreground/20 transition-[width,opacity] duration-300 ease-out ${
          active ? "w-2" : "w-1.5"
        }`}
      >
        <div
          ref={thumbRef}
          className="absolute inset-x-0 top-0 rounded-full bg-foreground"
          style={{ height: THUMB_H }}
        />
      </div>
    </div>
  );
}
