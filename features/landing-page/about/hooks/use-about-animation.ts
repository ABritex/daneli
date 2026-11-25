"use client";

import { useEffect, type RefObject } from "react";

type Args = {
  sectionRef: RefObject<HTMLElement | null>;
  measureRef: RefObject<HTMLSpanElement | null>;
  imageWrapRef: RefObject<HTMLDivElement | null>;
  setCopyDone: (v: boolean) => void;
};

/* ---------- tiny helpers: everything below is a plain function of scroll position ---------- */
const clamp = (v: number, a = 0, b = 1) => Math.min(b, Math.max(a, v));
const lerp = (a: number, b: number, t: number) => a + (b - a) * t;
/** 0..1 progress of `t` between `start` and `start + len` */
const seg = (t: number, start: number, len: number) => clamp((t - start) / len);

const pow2out = (x: number) => 1 - (1 - x) * (1 - x);
const pow3out = (x: number) => 1 - Math.pow(1 - x, 3);
const pow2in = (x: number) => x * x;
const pow3in = (x: number) => x * x * x;
const pow2inout = (x: number) => (x < 0.5 ? 2 * x * x : 1 - Math.pow(-2 * x + 2, 2) / 2);

/* pinned part is measured in "time units" (same numbers the old timeline used) */
const TOTAL = 1.45;

export function useAboutAnimation({ sectionRef, measureRef, imageWrapRef, setCopyDone }: Args) {
  useEffect(() => {
    const section = sectionRef.current;
    const measure = measureRef.current;
    const imageWrap = imageWrapRef.current;
    if (!section || !measure || !imageWrap) return;

    const stage = section.querySelector<HTMLElement>("[data-stage]");
    const image = section.querySelector<HTMLElement>("[data-image]");
    const backWrap = section.querySelector<HTMLElement>("[data-word-wrap='back']");
    const frontWrap = section.querySelector<HTMLElement>("[data-word-wrap='front']");
    const copyItems = Array.from(section.querySelectorAll<HTMLElement>("[data-copy-item]"));
    if (!image || !backWrap || !frontWrap) return;

    /* ---------- size PORTFOLIO to the stage (reads the CURRENT font size, so any loaded font works) ---------- */
    let away = window.innerWidth;
    const fit = () => {
      const word = measure.firstElementChild as HTMLElement | null;
      if (word) {
        const fs = parseFloat(getComputedStyle(word).fontSize) || 100;
        const emW = measure.offsetWidth / fs;
        if (emW) {
          const size = Math.min((section.clientWidth * 0.94) / emW, 256);
          const prev = parseFloat(section.style.getPropertyValue("--word-size")) || 0;
          if (Math.abs(size - prev) > 0.5) section.style.setProperty("--word-size", `${size}px`);
        }
      }
      /* how far a layer must travel to be fully off-screen */
      away = window.innerWidth / 2 + measure.offsetWidth / 2 + window.innerWidth * 0.05;
    };
    fit();
    const ro = new ResizeObserver(fit); // font swapping in, resize, rotation
    ro.observe(measure);
    window.addEventListener("resize", fit);

    let alive = true;
    document.fonts
      ?.load('800 100px "Monument Extended"')
      .catch(() => undefined)
      .finally(() => alive && fit());

    backWrap.style.transformOrigin = "50% 50%";
    frontWrap.style.transformOrigin = "50% 50%";

    /* ---------- write one frame ---------- */
    let copyDone = false;
    const render = (e: number, P: number) => {
      const t = P * TOTAL; // pinned time

      /* IMAGE: opens like an iris on the way in, closes to a point on the way out */
      const ie = pow2out(seg(e, 0, 0.8));
      const ix = pow2in(seg(t, 0.3, 0.3));
      const iris = ix > 0 ? lerp(150, 0, ix) : lerp(0, 150, ie);
      const iscale = ix > 0 ? lerp(1, 1.2, ix) : lerp(1.25, 1, ie);
      image.style.clipPath = `circle(${iris}% at 50% 100%)`;
      image.style.transform = `scale(${iscale})`;

      /* BACK word: slides in from the left, leaves to the right */
      const be = pow3out(seg(e, 0.3, 0.7));
      const bx = pow3in(seg(t, 0.18, 0.4));
      if (bx > 0) {
        backWrap.style.transform = `translate3d(${lerp(0, away, bx)}px,0,0) scale(${lerp(1, 0.94, bx)})`;
        backWrap.style.opacity = String(lerp(1, 0, bx));
        backWrap.style.filter = "none";
      } else {
        backWrap.style.transform = `translate3d(${lerp(-away, 0, be)}px,0,0) scale(${lerp(1.6, 1, be)})`;
        backWrap.style.opacity = String(be);
        backWrap.style.filter = be < 1 ? `blur(${lerp(14, 0, be)}px)` : "none";
      }

      /* FRONT outline: slides in from the right, whips past the camera on the way out */
      const fe = pow3out(seg(e, 0.5, 0.5));
      const fx = pow2in(seg(t, 0.12, 0.38));
      if (fx > 0) {
        frontWrap.style.transform = `translate3d(${lerp(0, -away * 0.35, fx)}px,0,0) scale(${lerp(1, 3.2, fx)})`;
        frontWrap.style.opacity = String(lerp(1, 0, fx));
        frontWrap.style.filter = `blur(${lerp(0, 10, fx)}px)`;
      } else {
        frontWrap.style.transform = `translate3d(${lerp(away, 0, fe)}px,0,0) scale(${lerp(1.35, 1, fe)})`;
        frontWrap.style.opacity = String(fe);
        frontWrap.style.filter = "none";
      }

      /* COPY: appears once the stage has cleared, leaves just before the section unpins */
      const cin = pow3out(seg(t, 0.62, 0.35));
      const cout = pow2inout(seg(t, 1.15, 0.2));
      const copyOpacity = cin * (1 - cout);
      const copyY = lerp(24, 0, cin) + lerp(0, -30, cout);
      const copyBlur = lerp(0, 4, cout);
      for (const el of copyItems) {
        el.style.opacity = String(copyOpacity);
        el.style.transform = `translate3d(0,${copyY}px,0)`;
        el.style.filter = copyBlur > 0.05 ? `blur(${copyBlur}px)` : "none";
      }

      /* highlighter draws only once everything has landed, replays when you scroll back */
      const done = t >= 0.97 && t < 1.15;
      if (done !== copyDone) {
        copyDone = done;
        setCopyDone(done);
      }
    };

    /* ---------- read the scroll position, smooth it a little, render ---------- */
    let ce = -1;
    let cP = -1;
    let last = performance.now();
    let raf = 0;
    let shown = false;

    const tick = (now: number) => {
      raf = requestAnimationFrame(tick);
      const dt = Math.min((now - last) / 1000, 0.05);
      last = now;

      const H = window.innerHeight;
      const rect = section.getBoundingClientRect();
      /* far away: nothing to do */
      if (rect.top > H * 2 || rect.bottom < -H) {
        if (shown) return;
      }

      const targetE = clamp((H * 0.95 - rect.top) / (H * 0.85));
      const targetP = clamp(-rect.top / Math.max(rect.height - H, 1));

      /* first frame: jump straight to the real state, no easing in from zero */
      if (ce < 0) {
        ce = targetE;
        cP = targetP;
      } else {
        const k = 1 - Math.exp(-dt * 14);
        ce += (targetE - ce) * k;
        cP += (targetP - cP) * k;
        if (Math.abs(targetE - ce) < 0.0005) ce = targetE;
        if (Math.abs(targetP - cP) < 0.0005) cP = targetP;
      }

      render(ce, cP);

      /* the stage is hidden until the first correct frame has been written (no flash of the wrong state) */
      if (!shown && stage) {
        stage.style.opacity = "1";
        shown = true;
      }
    };
    raf = requestAnimationFrame(tick);

    return () => {
      alive = false;
      cancelAnimationFrame(raf);
      ro.disconnect();
      window.removeEventListener("resize", fit);
    };
  }, [sectionRef, measureRef, imageWrapRef, setCopyDone]);
}