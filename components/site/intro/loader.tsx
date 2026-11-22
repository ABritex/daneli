"use client";

import { useEffect, useRef, useState } from "react";

/* ------------------------------------------------------------------ */
/* Timeline (ms). Everything below is derived from this one object.    */
/* ------------------------------------------------------------------ */
const T = {
  enterEnd: 1100, // brush sweeps in from the left
  paintEnd: 3300, // brush paints the D
  exitEnd: 3750, // brush leaves, D slides, letters start
  fadeAt: 6000, // overlay fades out
  unmountAt: 6900,
};

const EASE = {
  enter: [0.22, 0.7, 0.2, 1],
  paint: [0.45, 0, 0.35, 1],
  exit: [0.6, 0, 0.9, 0.5],
} as const;

const GAP = 14;
const D_OUT =
  "M0 0H40C68 0 84 22 84 50C84 78 68 100 40 100H0Z M22 20V80H38C54 80 62 68 62 50C62 32 54 20 38 20Z";
const D_CENTERLINE = "M11 89V11H40C60 11 73 28 73 50C73 72 60 89 40 89H11";
const LETTERS = [
  { c: "D", w: 84, p: D_OUT },
  { c: "A", w: 90, p: "M0 100L35 0H55L90 100H66L60 82H30L24 100Z M45 26L36 60H54Z" },
  { c: "N", w: 84, p: "M0 100V0H24L60 62V0H84V100H60L24 38V100Z" },
  { c: "E", w: 66, p: "M0 0H66V22H22V39H58V61H22V78H66V100H0Z" },
  { c: "L", w: 70, p: "M0 0H22V78H70V100H0Z" },
  { c: "I", w: 22, p: "M0 0H22V100H0Z" },
];

const D_APPEAR = { delay: 450, dur: 900, ease: "cubic-bezier(.2,.8,.2,1)" };
const D_SLIDE = { delay: T.exitEnd, dur: 950, ease: "cubic-bezier(.65,0,.25,1)" };
const STAGGER = { start: T.exitEnd + 400, step: 160 };
const LETTER_FX: Record<string, { dur: number; ease: string; rot: number; rise: number; over: number }> = {
  A: { dur: 1100, ease: "cubic-bezier(.22,.9,.25,1)", rot: -14, rise: 12, over: 5 },
  N: { dur: 1050, ease: "cubic-bezier(.2,.85,.2,1)", rot: 10, rise: -10, over: 4 },
  E: { dur: 1000, ease: "cubic-bezier(.25,.8,.2,1)", rot: -9, rise: 11, over: 4 },
  L: { dur: 950, ease: "cubic-bezier(.3,.75,.25,1)", rot: 12, rise: -12, over: 4 },
  I: { dur: 850, ease: "cubic-bezier(.16,1,.3,1)", rot: -16, rise: 10, over: 3 },
};

const REST_ANGLE = 24;

/* ------------------------------------------------------------------ */
/* Small helpers                                                       */
/* ------------------------------------------------------------------ */
type Pt = { x: number; y: number };
const clamp01 = (v: number) => Math.max(0, Math.min(1, v));
const clampN = (v: number, a: number, b: number) => Math.max(a, Math.min(b, v));
const shortest = (a: number) => ((((a + 180) % 360) + 360) % 360) - 180;

function bez(x1: number, y1: number, x2: number, y2: number) {
  const cx = 3 * x1;
  const bx = 3 * (x2 - x1) - cx;
  const ax = 1 - cx - bx;
  const cy = 3 * y1;
  const by = 3 * (y2 - y1) - cy;
  const ay = 1 - cy - by;
  const X = (t: number) => ((ax * t + bx) * t + cx) * t;
  const Y = (t: number) => ((ay * t + by) * t + cy) * t;
  return (x: number) => {
    if (x <= 0) return 0;
    if (x >= 1) return 1;
    let lo = 0;
    let hi = 1;
    let t = x;
    for (let i = 0; i < 20; i++) {
      const v = X(t);
      if (Math.abs(v - x) < 1e-5) break;
      if (v < x) lo = t;
      else hi = t;
      t = (lo + hi) / 2;
    }
    return Y(t);
  };
}

function rng(seed: number) {
  return () => {
    seed = (seed + 0x6d2b79f5) | 0;
    let t = Math.imul(seed ^ (seed >>> 15), 1 | seed);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

/* ---- polyline with arc-length lookup (built once, sampled per frame) ---- */
type Poly = { pts: Pt[]; cum: number[]; len: number };

function makePoly(pts: Pt[]): Poly {
  const cum = [0];
  for (let i = 1; i < pts.length; i++) {
    cum.push(cum[i - 1] + Math.hypot(pts[i].x - pts[i - 1].x, pts[i].y - pts[i - 1].y));
  }
  return { pts, cum, len: cum[cum.length - 1] || 1 };
}

function sample(pl: Poly, s: number) {
  const target = clamp01(s) * pl.len;
  let lo = 0;
  let hi = pl.cum.length - 1;
  while (hi - lo > 1) {
    const mid = (lo + hi) >> 1;
    if (pl.cum[mid] <= target) lo = mid;
    else hi = mid;
  }
  const a = pl.pts[lo];
  const b = pl.pts[hi];
  const seg = pl.cum[hi] - pl.cum[lo] || 1;
  const k = (target - pl.cum[lo]) / seg;
  return {
    x: a.x + (b.x - a.x) * k,
    y: a.y + (b.y - a.y) * k,
    tx: (b.x - a.x) / seg,
    ty: (b.y - a.y) / seg,
  };
}

function catmull(pts: Pt[], per = 16): Pt[] {
  const out: Pt[] = [];
  for (let i = 0; i < pts.length - 1; i++) {
    const p0 = pts[Math.max(0, i - 1)];
    const p1 = pts[i];
    const p2 = pts[i + 1];
    const p3 = pts[Math.min(pts.length - 1, i + 2)];
    for (let k = 0; k < per; k++) {
      const t = k / per;
      const t2 = t * t;
      const t3 = t2 * t;
      out.push({
        x: 0.5 * (2 * p1.x + (-p0.x + p2.x) * t + (2 * p0.x - 5 * p1.x + 4 * p2.x - p3.x) * t2 + (-p0.x + 3 * p1.x - 3 * p2.x + p3.x) * t3),
        y: 0.5 * (2 * p1.y + (-p0.y + p2.y) * t + (2 * p0.y - 5 * p1.y + 4 * p2.y - p3.y) * t2 + (-p0.y + 3 * p1.y - 3 * p2.y + p3.y) * t3),
      });
    }
  }
  out.push(pts[pts.length - 1]);
  return out;
}

/* ------------------------------------------------------------------ */
/* Bristle brush                                                       */
/* A stroke is N thin lines laid side by side across the brush width.  */
/* Every bristle has its own thickness, opacity, lead/lag along the    */
/* stroke, a slow sideways wobble and a point where its paint runs     */
/* dry, which is what gives the streaky, ragged look of a real brush.  */
/* ------------------------------------------------------------------ */
type Bristle = {
  o: number; // -1..1 position across the brush
  wk: number; // thickness relative to bristle spacing (>1 so they overlap)
  a: number; // base opacity
  dryAt: number; // stroke progress at which this bristle starts running dry
  lag: number; // lead / lag along the stroke direction
  freq: number;
  ph: number;
  px: number;
  py: number;
  live: boolean;
};

function makeBristles(n: number, seed: number, dryLo: number, dryHi: number): Bristle[] {
  const r = rng(seed);
  return Array.from({ length: n }, (_, i) => {
    const o = (i / (n - 1)) * 2 - 1;
    return {
      o,
      wk: 1.5 + r() * 1.7,
      a: 0.78 + r() * 0.22,
      dryAt: dryLo + r() * (dryHi - dryLo) - Math.abs(o) * 0.1,
      lag: (r() - 0.5) * 2,
      freq: 0.08 + r() * 0.17,
      ph: r() * Math.PI * 2,
      px: 0,
      py: 0,
      live: false,
    };
  });
}

function makePainter(
  ctx: CanvasRenderingContext2D,
  pl: Poly,
  bristles: Bristle[],
  o: { halfW: number; step: number; pressIn: number },
) {
  let cursor = 0;
  let ptx = 1;
  let pty = 0;
  let init = false;
  const n = bristles.length;
  return (s: number) => {
    const stepS = o.step / pl.len;
    ctx.lineCap = "butt";
    ctx.strokeStyle = "#fff";
    while (cursor < s) {
      cursor = Math.min(s, cursor + stepS);
      const p = sample(pl, cursor);
      if (!init) {
        ptx = p.tx;
        pty = p.ty;
        init = true;
      } else {
        // the brush head swivels around corners instead of snapping
        ptx += (p.tx - ptx) * 0.22;
        pty += (p.ty - pty) * 0.22;
        const m = Math.hypot(ptx, pty) || 1;
        ptx /= m;
        pty /= m;
      }
      const nx = -pty;
      const ny = ptx;
      const dist = cursor * pl.len;
      const press = clamp01(dist / o.pressIn);
      const hw = o.halfW * (0.5 + 0.5 * press) * (1 + 0.05 * Math.sin(dist * 0.35));
      const sp = (2 * hw) / (n - 1);
      for (const b of bristles) {
        const load = cursor <= b.dryAt ? 1 : Math.max(0, 1 - (cursor - b.dryAt) / 0.16);
        const off = b.o * hw + Math.sin(dist * b.freq + b.ph) * sp * 0.35;
        const lag = b.lag * hw * 0.5;
        const bx = p.x + nx * off + ptx * lag;
        const by = p.y + ny * off + pty * lag;
        if (b.live && load > 0.02) {
          ctx.globalAlpha = Math.min(1, b.a * load * (0.4 + 0.6 * press));
          ctx.lineWidth = sp * b.wk;
          ctx.beginPath();
          ctx.moveTo(b.px, b.py);
          ctx.lineTo(bx, by);
          ctx.stroke();
        }
        b.px = bx;
        b.py = by;
        b.live = true;
      }
    }
    ctx.globalAlpha = 1;
  };
}

/* ------------------------------------------------------------------ */
/* Component                                                           */
/* ------------------------------------------------------------------ */
export function Loader() {
  const [visible, setVisible] = useState<boolean>(true);
  const [faded, setFaded] = useState(false);
  const stageRef = useRef<HTMLDivElement>(null);
  const counterRef = useRef<HTMLSpanElement>(null);

  // The <head> boot script is the source of truth (it already handled
  // "repeat visit", ?loader=1 and dev mode before first paint).
  useEffect(() => {
    try {
      const root = document.documentElement;
      if (root.dataset.loader === "skip") {
        window.dispatchEvent(new Event("daneli-loader-done"));
        // eslint-disable-next-line react-hooks/set-state-in-effect
        setVisible(false);
      } else {
        root.dataset.loader = "playing";
      }
    } catch {
      // keep loader visible
    }
  }, []);

  useEffect(() => {
    if (!visible) return;
    const root = document.documentElement;
    if (root.dataset.loader === "skip") return; // nothing to build for a skipped loader
    const stage = stageRef.current;
    if (!stage) return;

    let cancelled = false;
    const reduce = false;

    const prevOverflow = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    window.scrollTo(0, 0);

    const word = stage.querySelector<HTMLDivElement>("#word")!;
    const brush = stage.querySelector<HTMLDivElement>("#brush")!;
    const fx = stage.querySelector<HTMLCanvasElement>("#fx")!;
    const centerline = stage.querySelector<SVGPathElement>("#centerline")!;

    const eEnter = bez(...EASE.enter);
    const ePaint = bez(...EASE.paint);
    const eExit = bez(...EASE.exit);

    const anims: Animation[] = [];
    let raf = 0;
    const timers: ReturnType<typeof setTimeout>[] = [];

    /* ------------------------------ layout ------------------------------ */
    const vw = window.innerWidth;
    const vh = window.innerHeight;
    const dpr = Math.min(window.devicePixelRatio || 1, 2);
    const W = LETTERS.reduce((s, l) => s + l.w, 0) + GAP * (LETTERS.length - 1);
    const u = Math.min((vw * 0.84) / W, (vh * 0.3) / 100);
    const cx = vw / 2;
    const cy = vh / 2;

    let acc = 0;
    const items = LETTERS.map((l) => {
      const it = {
        ...l,
        finalX: (acc - W / 2) * u,
        centerX: (-l.w / 2) * u,
        el: document.createElement("div"),
      };
      acc += l.w + GAP;
      return it;
    });

    word.textContent = "";
    items.forEach((l, i) => {
      const el = l.el;
      el.className = "l";
      el.style.width = l.w * u + "px";
      el.style.height = 100 * u + "px";
      el.style.zIndex = String(i === 0 ? 20 : 10 - i);
      el.style.transform = `translate(${l.centerX}px,-50%)`;
      el.style.opacity = "0";
      if (l.c === "D") {
        // grey base, bristle canvas on top, solid white that fades in at the end
        el.innerHTML =
          `<svg viewBox="0 0 84 100" width="100%" height="100%"><path d="${l.p}" fill-rule="evenodd" fill="#5a5959"/></svg>` +
          `<canvas class="dpaint"></canvas>` +
          `<svg class="dfill" viewBox="0 0 84 100" width="100%" height="100%"><path d="${l.p}" fill-rule="evenodd" fill="#fff"/></svg>`;
      } else {
        el.innerHTML = `<svg viewBox="0 0 ${l.w} 100" width="100%" height="100%"><path fill-rule="evenodd" d="${l.p}" fill="#fff"/></svg>`;
      }
      word.appendChild(el);
    });

    const dItem = items[0];
    const dCanvas = dItem.el.querySelector<HTMLCanvasElement>("canvas.dpaint")!;
    const dFill = dItem.el.querySelector<SVGSVGElement>("svg.dfill")!;

    /* D centreline -> polyline in the D's local units (sampled once) */
    const clLen = centerline.getTotalLength();
    const clPts: Pt[] = [];
    const N = 220;
    for (let i = 0; i <= N; i++) {
      const p = centerline.getPointAtLength((i / N) * clLen);
      clPts.push({ x: p.x, y: p.y });
    }
    const dPoly = makePoly(clPts);
    const toScreen = (p: Pt): Pt => ({ x: cx + (p.x - 42) * u, y: cy + (p.y - 50) * u });
    const start = toScreen(clPts[0]);

    /* entry streak: smooth wiggly curve from off-screen to the D start */
    const x0 = -30;
    const y0 = start.y + 10 * u;
    const knots: Pt[] = [];
    for (let i = 0; i <= 6; i++) {
      knots.push({
        x: x0 + (start.x - x0) * (i / 6),
        y: y0 + (start.y - y0) * (i / 6) + (i % 2 === 0 ? -18 * u : 18 * u) * (1 - i / 6),
      });
    }
    const streakPoly = makePoly(catmull(knots, 16));

    /* canvases */
    fx.width = Math.round(vw * dpr);
    fx.height = Math.round(vh * dpr);
    const fctx = fx.getContext("2d");
    dCanvas.width = Math.round(84 * u * dpr);
    dCanvas.height = Math.round(100 * u * dpr);
    const dctx = dCanvas.getContext("2d");

    let paintStreak: (s: number) => void = () => {};
    let paintD: (s: number) => void = () => {};
    if (fctx && dctx) {
      fctx.setTransform(dpr, 0, 0, dpr, 0, 0);
      paintStreak = makePainter(fctx, streakPoly, makeBristles(26, 7, 0.5, 1.05), {
        halfW: 9 * u,
        step: 3,
        pressIn: 80 * u,
      });
      // draw in the D's own units; clip once so paint never leaves the letter
      dctx.setTransform(dpr * u, 0, 0, dpr * u, 0, 0);
      dctx.clip(new Path2D(D_OUT), "evenodd");
      paintD = makePainter(dctx, dPoly, makeBristles(32, 21, 0.86, 1.1), {
        halfW: 15,
        step: 0.8,
        pressIn: 18,
      });
    }

    /* brush sprite: tip sits on (x, y) */
    const BW = 260 * u;
    const BH = BW / 4;
    const tipX = (BW * 398) / 400;
    const tipY = BH * 0.52;
    Object.assign(brush.style, {
      width: BW + "px",
      height: BH + "px",
      marginLeft: -tipX + "px",
      marginTop: -tipY + "px",
      transformOrigin: `${tipX}px ${tipY}px`,
      display: "none",
    });

    /* --------------------------- WAAPI (compositor) --------------------------- */
    const at = (x: number, y: number, s: number, r: number) =>
      `translate(${x}px,calc(-50% + ${y * u}px)) scale(${s}) rotate(${r}deg)`;

    if (reduce) {
      items.forEach((l) => {
        l.el.style.opacity = "1";
        l.el.style.transform = `translate(${l.finalX}px,-50%)`;
      });
      dFill.style.opacity = "1";
      timers.push(setTimeout(() => !cancelled && setFaded(true), 500));
      timers.push(
        setTimeout(() => {
          try {
            sessionStorage.setItem("daneli-loaded", "true");
          } catch {
            // ignore
          }
          setVisible(false);
        }, 1400),
      );
    } else {
      anims.push(
        dItem.el.animate(
          [
            { opacity: 0, transform: `translate(${dItem.centerX}px,-50%) scale(.92)` },
            { opacity: 1, transform: `translate(${dItem.centerX}px,-50%) scale(1)` },
          ],
          { delay: D_APPEAR.delay, duration: D_APPEAR.dur, easing: D_APPEAR.ease, fill: "both" },
        ),
        dItem.el.animate(
          [
            { transform: `translate(${dItem.centerX}px,-50%)` },
            { transform: `translate(${dItem.finalX}px,-50%)` },
          ],
          { delay: D_SLIDE.delay, duration: D_SLIDE.dur, easing: D_SLIDE.ease, fill: "forwards" },
        ),
        // patches any dry-brush gaps while the brush is leaving
        dFill.animate([{ opacity: 0 }, { opacity: 1 }], {
          delay: T.paintEnd - 150,
          duration: 500,
          easing: "ease-out",
          fill: "both",
        }),
      );

      items.slice(1).forEach((l, k) => {
        const f = LETTER_FX[l.c];
        const dir = Math.sign(l.finalX - l.centerX) || 1;
        l.el.style.transformOrigin = "50% 100%";
        // transform + opacity only: no blur filter, so it stays on the compositor
        anims.push(
          l.el.animate(
            [
              { opacity: 0, transform: at(l.centerX, f.rise, 0.8, f.rot), offset: 0, easing: f.ease },
              { opacity: 1, offset: 0.12, easing: f.ease },
              {
                opacity: 1,
                transform: at(l.finalX + dir * f.over * u, -f.rise * 0.25, 1.05, -f.rot * 0.12),
                offset: 0.68,
                easing: "cubic-bezier(.45,0,.2,1)",
              },
              { opacity: 1, transform: at(l.finalX, 0, 1, 0), offset: 1 },
            ],
            { delay: STAGGER.start + k * STAGGER.step, duration: f.dur + 350, easing: "linear", fill: "both" },
          ),
        );
      });
    }

    /* ------------------------------- frame loop ------------------------------- */
    let ang = REST_ANGLE;
    let last = 0;
    let t0 = 0;
    let lastCount = -1;

    const place = (x: number, y: number) => {
      brush.style.transform = `translate3d(${x}px,${y}px,0) rotate(${ang}deg)`;
    };

    const frame = (now: number) => {
      if (cancelled) return;
      if (!t0) {
        t0 = now;
        last = now;
      }
      const t = now - t0;
      const dt = Math.min(0.05, (now - last) / 1000);
      last = now;

      // only touch the DOM when the number actually changes
      const count = Math.min(36, Math.floor((t / T.fadeAt) * 36));
      if (count !== lastCount && counterRef.current) {
        lastCount = count;
        counterRef.current.textContent = String(count).padStart(2, "0");
      }

      if (t < T.enterEnd) {
        const e = eEnter(t / T.enterEnd);
        const p = sample(streakPoly, e);
        paintStreak(e);
        // handle trails behind the direction of travel, blended with a natural resting tilt
        const th = (Math.atan2(p.ty, p.tx) * 180) / Math.PI;
        const target = clampN(REST_ANGLE + 0.45 * shortest(th - REST_ANGLE), -55, 75);
        ang += shortest(target - ang) * (1 - Math.exp(-dt * 9));
        brush.style.display = "block";
        place(p.x, p.y);
      } else if (t < T.paintEnd) {
        const s = ePaint(clamp01((t - T.enterEnd) / (T.paintEnd - T.enterEnd)));
        const p = sample(dPoly, s);
        paintStreak(1);
        paintD(s);
        const th = (Math.atan2(p.ty, p.tx) * 180) / Math.PI;
        const target = clampN(REST_ANGLE + 0.45 * shortest(th - REST_ANGLE), -55, 75);
        ang += shortest(target - ang) * (1 - Math.exp(-dt * 9));
        const sp = toScreen(p);
        place(sp.x, sp.y + 0.6 * Math.sin(t * 0.03) * u);
      } else if (t < T.exitEnd) {
        paintD(1);
        const e = eExit(clamp01((t - T.paintEnd) / (T.exitEnd - T.paintEnd)));
        ang += (REST_ANGLE - ang) * (1 - Math.exp(-dt * 6));
        place(start.x - e * (start.x + BW * 1.1), start.y - e * 3 * u);
      } else if (brush.style.display !== "none") {
        brush.style.display = "none";
        fx.style.display = "none";
      }

      // streak fades via CSS opacity on its own layer
      if (t < T.enterEnd + 900) fx.style.opacity = String(1 - clamp01((t - T.enterEnd) / 900));

      if (t < T.fadeAt) raf = requestAnimationFrame(frame);
    };

    if (!reduce) {
      raf = requestAnimationFrame(frame);
      timers.push(setTimeout(() => !cancelled && setFaded(true), T.fadeAt));
    timers.push(
      setTimeout(() => {
        try {
          // no persistence: loader plays on every refresh
        } catch {
          // ignore
        }
        setVisible(false);
      }, T.unmountAt),
    );
    }

    return () => {
      cancelled = true;
      cancelAnimationFrame(raf);
      timers.forEach(clearTimeout);
      anims.forEach((a) => a.cancel());
      document.body.style.overflow = prevOverflow;
    };
  }, [visible]);

  useEffect(() => {
    if (!visible) {
      try {
        const root = document.documentElement;
        if (root.dataset.loader !== "skip") {
          root.dataset.loader = "done";
          window.dispatchEvent(new Event("daneli-loader-done"));
        }
      } catch {
        // ignore
      }
    }
  }, [visible]);

  if (!visible) return null;

  return (
    <div
      id="daneli-loader"
      ref={stageRef}
      className="fixed inset-0 z-[10020]"
      style={{
        opacity: faded ? 0 : 1,
        transition: "opacity 800ms ease-out",
        background: "#000",
      }}
      aria-hidden={faded}
    >
      <canvas id="fx" aria-hidden="true" />
      <svg aria-hidden="true" style={{ position: "absolute", width: 1, height: 1, opacity: 0, pointerEvents: "none" }}>
        <path id="centerline" d={D_CENTERLINE} fill="none" />
      </svg>
      <div id="word" role="img" aria-label="DANELI" />

      <div className="brush" id="brush" aria-hidden="true">
        <svg viewBox="0 0 400 100">
          <defs>
            <linearGradient id="metal" x1="0" y1="0" x2="0" y2="1">
              <stop offset="0" stopColor="#e3e8ee" />
              <stop offset="0.5" stopColor="#9aa5b4" />
              <stop offset="1" stopColor="#6d7889" />
            </linearGradient>
            <linearGradient id="wood" x1="0" y1="0" x2="0" y2="1">
              <stop offset="0" stopColor="#d9a066" />
              <stop offset="1" stopColor="#a86d38" />
            </linearGradient>
          </defs>

          {/* static soft shadow (no CSS filter, so nothing repaints while it moves) */}
          <g transform="translate(4 9)" fill="#000" opacity="0.28">
            <path d="M4 44 L232 38 L232 64 L4 58 Q0 51 4 44Z" />
            <rect x="232" y="27" width="58" height="48" rx="5" />
            <path d="M290 29 C325 25 365 34 398 52 C365 70 325 77 290 73Z" />
          </g>

          {/* handle */}
          <path d="M4 44 L232 38 L232 64 L4 58 Q0 51 4 44Z" fill="url(#wood)" />
          <path d="M20 48 L228 45" stroke="#fff" strokeOpacity="0.18" strokeWidth="2" />
          {/* ferrule */}
          <rect x="232" y="27" width="58" height="48" rx="5" fill="url(#metal)" />
          <path d="M252 27V75M268 27V75" stroke="#5b6676" strokeWidth="1.5" opacity="0.5" />
          {/* bristle head */}
          <path d="M290 29 C325 25 365 34 398 52 C365 70 325 77 290 73Z" fill="#e8d3ac" />
          <g stroke="#b99a62" strokeWidth="0.9" fill="none" opacity="0.6">
            <path d="M292 33 C330 31 366 40 396 51" />
            <path d="M292 39 C330 38 368 45 397 52" />
            <path d="M292 45 C332 45 370 49 398 52" />
            <path d="M292 51 L398 52" />
            <path d="M292 57 C332 58 370 55 398 52" />
            <path d="M292 63 C330 64 368 59 397 52" />
            <path d="M292 69 C330 71 366 64 396 53" />
          </g>
          {/* paint-loaded tip with a ragged edge */}
          <path
            d="M333 32 C352 34 380 43 398 52 C380 61 352 70 333 72 C339 66 335 61 340 57 C334 52 339 47 336 43 C339 39 334 36 333 32Z"
            fill="#fff"
          />
          <g stroke="#fff" strokeWidth="0.8" strokeLinecap="round" opacity="0.85">
            <path d="M392 49 L399 47" />
            <path d="M394 52 L400 52" />
            <path d="M392 55 L399 57" />
          </g>
        </svg>
      </div>

      <div className="pointer-events-none absolute inset-x-4 top-6 flex justify-between text-xs tracking-[0.3em] text-white/50 uppercase md:inset-x-6">
        <span>DanEli</span>
        <span>Portfolio 2026</span>
      </div>
      <div className="pointer-events-none absolute bottom-6 left-6 md:bottom-8 md:left-8">
        <div className="flex items-center gap-3 font-mono">
          <svg viewBox="0 0 40 28" className="h-6 w-9 text-white/70" fill="none" stroke="currentColor" strokeWidth="1.2">
            <rect x="1" y="4" width="38" height="22" rx="3" />
            <circle cx="20" cy="15" r="6" />
            <circle cx="20" cy="15" r="2.5" />
            <rect x="14" y="1" width="12" height="4" rx="1" />
          </svg>
          <div className="flex items-baseline gap-1">
            <span ref={counterRef} className="text-2xl tabular-nums leading-none md:text-3xl">
              00
            </span>
            <span className="text-xs text-white/40">/36</span>
          </div>
        </div>
      </div>
    </div>
  );
}
