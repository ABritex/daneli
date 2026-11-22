"use client";

import { useEffect, useRef } from "react";

/**
 * Drafting cursor: hairline crosshair, edge rulers, coordinate chip,
 * click-to-pin, drag-to-measure (Shift = 45deg steps, Esc = cancel).
 *
 * Own implementation of the behaviour, no third-party code.
 * Mount ONCE near the root (e.g. app/layout.tsx). It draws on a fixed,
 * pointer-events-none canvas, so it works over every page and over Lenis.
 *
 * Optional per-element hooks:
 *   data-cursor-label="Open"   text shown in the chip while hovering
 *   data-cursor="native"       keep the native cursor + hide the crosshair there
 */
export type Measurement = { x1: number; y1: number; x2: number; y2: number; dx: number; dy: number; length: number; angle: number };

type Props = {
  /** any CSS colour, var() allowed */
  color?: string;
  accentColor?: string;
  backgroundColor?: string;
  lineOpacity?: number;
  /** clear radius around the exact point */
  gap?: number;
  rulers?: "always" | "none";
  rulerSize?: number;
  tickSpacing?: number;
  measure?: boolean;
  /** seconds a finished measurement stays */
  measureHold?: number;
  pins?: boolean;
  maxPins?: number;
  /** seconds a pin stays */
  pinLife?: number;
  hideCursor?: boolean;
  disabled?: boolean;
  zIndex?: number;
  onMeasure?: (m: Measurement) => void;
  onPin?: (p: { x: number; y: number }) => void;
};

const INTERACTIVE = "a,button,input,textarea,select,summary,[role=button]";
const NATIVE = '[data-cursor="native"],input,textarea,select';

export function DraftingCursor({
  color = "var(--foreground)",
  accentColor = "#2f3cff",
  backgroundColor = "var(--background)",
  lineOpacity = 0.35,
  gap = 9,
  rulers = "always",
  rulerSize = 24,
  tickSpacing = 10,
  measure = true,
  measureHold = 2.5,
  pins = true,
  maxPins = 4,
  pinLife = 8,
  hideCursor = true,
  disabled = false,
  zIndex = 9998,
  onMeasure,
  onPin,
}: Props) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  // latest props without re-binding listeners
  const cfg = useRef({
    color,
    accentColor,
    backgroundColor,
    lineOpacity,
    gap,
    rulers,
    rulerSize,
    tickSpacing,
    measure,
    measureHold,
    pins,
    maxPins,
    pinLife,
    onMeasure,
    onPin,
  });

  // Keep cfg updated on every render
  useEffect(() => {
    cfg.current = {
      color,
      accentColor,
      backgroundColor,
      lineOpacity,
      gap,
      rulers,
      rulerSize,
      tickSpacing,
      measure,
      measureHold,
      pins,
      maxPins,
      pinLife,
      onMeasure,
      onPin,
    };
  });

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas || disabled) return;
    if (!window.matchMedia("(hover: hover) and (pointer: fine)").matches) return;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    let vw = 0;
    let vh = 0;
    const resize = () => {
      const dpr = Math.min(window.devicePixelRatio || 1, 2);
      vw = window.innerWidth;
      vh = window.innerHeight;
      canvas.width = vw * dpr;
      canvas.height = vh * dpr;
      ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
    };
    resize();

    // hide native cursor
    let style: HTMLStyleElement | null = null;
    if (hideCursor) {
      style = document.createElement("style");
      style.textContent = `html.dc-on *:not(${NATIVE.split(",").map((s) => s).join(",")}):not([data-cursor="native"] *){cursor:none !important}`;
      document.head.appendChild(style);
      document.documentElement.classList.add("dc-on");
    }

    // canvas can't read var(): let the browser resolve colours for us
    let ink = "#000";
    let sig = "#00f";
    let bg = "#fff";
    const resolve = (v: string) => {
      canvas.style.color = v;
      return getComputedStyle(canvas).color;
    };
    const refreshColours = () => {
      ink = resolve(cfg.current.color);
      sig = resolve(cfg.current.accentColor);
      bg = resolve(cfg.current.backgroundColor);
    };
    refreshColours();

    const s = {
      x: -99,
      y: -99,
      k: 0,
      target: 0,
      down: false,
      drag: false,
      sx: 0,
      sy: 0,
      ex: 0,
      ey: 0,
      label: "",
      link: false,
    };
    let pinList: { x: number; y: number; t: number }[] = [];
    let done: { a: [number, number, number, number]; t: number } | null = null;

    const setEnd = (shift: boolean) => {
      let dx = s.x - s.sx;
      let dy = s.y - s.sy;
      if (shift) {
        const a = Math.round(Math.atan2(dy, dx) / (Math.PI / 4)) * (Math.PI / 4);
        const l = Math.hypot(dx, dy);
        dx = Math.cos(a) * l;
        dy = Math.sin(a) * l;
      }
      s.ex = s.sx + dx;
      s.ey = s.sy + dy;
    };

    const onMove = (e: PointerEvent) => {
      s.x = e.clientX;
      s.y = e.clientY;
      const t = e.target instanceof Element ? e.target : null;
      s.link = !!t?.closest(INTERACTIVE);
      s.label = t?.closest("[data-cursor-label]")?.getAttribute("data-cursor-label") ?? "";
      s.target = t?.closest(NATIVE) ? 0 : 1;
      if (s.down && cfg.current.measure) {
        if (Math.hypot(s.x - s.sx, s.y - s.sy) > 5) s.drag = true;
        setEnd(e.shiftKey);
      }
    };
    const onDown = (e: MouseEvent) => {
      const t = e.target instanceof Element ? e.target : null;
      if (e.button !== 0 || t?.closest(INTERACTIVE) || t?.closest(NATIVE)) return;
      e.preventDefault(); // no text selection while measuring
      s.down = true;
      s.drag = false;
      s.sx = e.clientX;
      s.sy = e.clientY;
      s.ex = s.sx;
      s.ey = s.sy;
    };
    const onUp = () => {
      if (!s.down) return;
      const c = cfg.current;
      if (s.drag) {
        done = { a: [s.sx, s.sy, s.ex, s.ey], t: performance.now() };
        const dx = s.ex - s.sx;
        const dy = s.ey - s.sy;
        c.onMeasure?.({
          x1: s.sx,
          y1: s.sy,
          x2: s.ex,
          y2: s.ey,
          dx,
          dy,
          length: Math.hypot(dx, dy),
          angle: (Math.atan2(-dy, dx) * 180) / Math.PI,
        });
      } else if (c.pins && !s.link) {
        pinList.push({ x: s.x, y: s.y, t: performance.now() });
        if (pinList.length > c.maxPins) pinList.shift();
        c.onPin?.({ x: s.x, y: s.y });
      }
      s.down = false;
      s.drag = false;
    };
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") {
        s.down = false;
        s.drag = false;
      }
    };
    const onLeave = () => (s.target = 0);
    const onEnter = () => (s.target = 1);

    window.addEventListener("pointermove", onMove, { passive: true });
    window.addEventListener("mousedown", onDown);
    window.addEventListener("mouseup", onUp);
    window.addEventListener("keydown", onKey);
    window.addEventListener("resize", resize);
    document.documentElement.addEventListener("mouseleave", onLeave);
    document.documentElement.addEventListener("mouseenter", onEnter);

    const drawNode = (x: number, y: number, alpha: number) => {
      // drafting node: outer circle + inner point
      ctx.save();
      ctx.globalAlpha = alpha;
      ctx.strokeStyle = sig;
      ctx.fillStyle = bg;
      ctx.lineWidth = 1;
      ctx.beginPath();
      ctx.arc(x, y, 5.5, 0, Math.PI * 2);
      ctx.fill();
      ctx.stroke();
      ctx.fillStyle = sig;
      ctx.beginPath();
      ctx.arc(x, y, 1.5, 0, Math.PI * 2);
      ctx.fill();
      ctx.restore();
    };

    const drawMeasure = (a: [number, number, number, number], alpha: number, live = false) => {
      const [x1, y1, x2, y2] = a;
      const dx = x2 - x1;
      const dy = y2 - y1;
      const len = Math.hypot(dx, dy);
      const legX = Math.abs(dx);
      const legY = Math.abs(dy);
    
      // angle between the horizontal leg and the line (always 0-90deg)
      const base = dx >= 0 ? 0 : Math.PI;
      const theta = Math.atan2(dy, dx);
      let diff = theta - base;
      if (diff > Math.PI) diff -= Math.PI * 2;
      if (diff < -Math.PI) diff += Math.PI * 2;
      const deg = (Math.abs(diff) * 180) / Math.PI;
    
      ctx.save();
    
      // run + rise legs
      ctx.setLineDash([4, 4]);
      ctx.strokeStyle = ink;
      ctx.globalAlpha = alpha * 0.45;
      ctx.beginPath();
      ctx.moveTo(x1, y1);
      ctx.lineTo(x2, y1);
      ctx.lineTo(x2, y2);
      ctx.stroke();
      ctx.setLineDash([]);
    
      // leg lengths (outside the triangle)
      ctx.fillStyle = ink;
      ctx.globalAlpha = alpha * 0.7;
      if (legX > 40) {
        ctx.textAlign = "center";
        ctx.fillText(String(Math.round(legX)), (x1 + x2) / 2, dy > 0 ? y1 - 6 : y1 + 14);
      }
      if (legY > 40) {
        ctx.textAlign = dx > 0 ? "left" : "right";
        ctx.fillText(String(Math.round(legY)), x2 + (dx > 0 ? 8 : -8), (y1 + y2) / 2 + 3);
      }
      ctx.textAlign = "left";
    
      // main line
      ctx.globalAlpha = alpha;
      ctx.strokeStyle = sig;
      ctx.lineWidth = 1.5;
      ctx.beginPath();
      ctx.moveTo(x1, y1);
      ctx.lineTo(x2, y2);
      ctx.stroke();
    
      // guide circle while drawing
      if (live && len > 1) {
        ctx.lineWidth = 1;
        ctx.globalAlpha = alpha * 0.12;
        ctx.beginPath();
        ctx.arc(x1, y1, len, 0, Math.PI * 2);
        ctx.stroke();
        ctx.setLineDash([2, 6]);
        ctx.globalAlpha = alpha * 0.18;
        ctx.beginPath();
        ctx.arc(x1, y1, len, 0, Math.PI * 2);
        ctx.stroke();
        ctx.setLineDash([]);
      }
    
      // ANGLE ARC at the start point
      if (len > 28 && legX > 4 && legY > 4) {
        ctx.lineWidth = 1;
        ctx.globalAlpha = alpha;
        ctx.strokeStyle = sig;
        ctx.beginPath();
        ctx.arc(x1, y1, Math.min(36, len * 0.35), base, theta, diff < 0);
        ctx.stroke();
      }
    
      drawNode(x1, y1, alpha);
      drawNode(x2, y2, alpha);
    
      // chip: length + angle
      const txt = `${Math.round(len)} px  ${deg.toFixed(0)}°`;
      const w = ctx.measureText(txt).width + 14;
      const tx = (x1 + x2) / 2 - w / 2;
      const ty = (y1 + y2) / 2 - 26;
      ctx.globalAlpha = alpha;
      ctx.fillStyle = sig;
      ctx.fillRect(tx, ty, w, 18);
      ctx.fillStyle = "#fff";
      ctx.fillText(txt, tx + 7, ty + 13);
      ctx.restore();
    };
    let raf = 0;
    let frame = 0;
    const draw = () => {
      raf = requestAnimationFrame(draw);
      if (document.hidden) return;
      if (frame++ % 20 === 0) refreshColours(); // follows theme / intro colour shifts
      s.k += (s.target - s.k) * 0.14;
      ctx.clearRect(0, 0, vw, vh);
      if (s.k < 0.01) return;

      const c = cfg.current;
      const k = s.k;
      const now = performance.now();
      const px = Math.round(s.x) + 0.5;
      const py = Math.round(s.y) + 0.5;
      const g = s.down ? Math.max(3, c.gap / 2) : c.gap;
      ctx.font = "500 10px ui-monospace, Menlo, monospace";
      ctx.lineWidth = 1;

      // rulers
      if (c.rulers === "always") {
        const R = c.rulerSize;
        ctx.globalAlpha = k * 0.92;
        ctx.fillStyle = bg;
        ctx.fillRect(0, 0, vw, R);
        ctx.fillRect(0, 0, R, vh);
        ctx.strokeStyle = ink;
        ctx.fillStyle = ink;
        ctx.beginPath();
        const max = Math.max(vw, vh);
        for (let i = 0; i * c.tickSpacing <= max; i++) {
          const v = i * c.tickSpacing + 0.5;
          const len = i % 10 === 0 ? R * 0.7 : i % 5 === 0 ? R * 0.45 : R * 0.25;
          if (v <= vw) {
            ctx.moveTo(v, R);
            ctx.lineTo(v, R - len);
          }
          if (v <= vh) {
            ctx.moveTo(R, v);
            ctx.lineTo(R - len, v);
          }
        }
        ctx.globalAlpha = k * 0.5;
        ctx.stroke();
        ctx.globalAlpha = k * 0.7;
        const step = c.tickSpacing * 10;
        for (let q = 1; q * step <= max; q++) {
          if (q * step <= vw) ctx.fillText(String(q * step), q * step + 3, 9);
          if (q * step <= vh) {
            ctx.save();
            ctx.translate(9, q * step - 3);
            ctx.rotate(-Math.PI / 2);
            ctx.fillText(String(q * step), 0, 0);
            ctx.restore();
          }
        }
        ctx.globalAlpha = k;
        ctx.fillStyle = sig;
        ctx.fillRect(px - 1, R - 8, 2, 8);
        ctx.fillRect(R - 8, py - 1, 8, 2);
      }

      // crosshair: grows from the point outwards with k
      ctx.strokeStyle = ink;
      ctx.globalAlpha = c.lineOpacity * k;
      ctx.beginPath();
      ctx.moveTo(px - g, py);
      ctx.lineTo(px - g - (s.x - g) * k, py);
      ctx.moveTo(px + g, py);
      ctx.lineTo(px + g + (vw - s.x - g) * k, py);
      ctx.moveTo(px, py - g);
      ctx.lineTo(px, py - g - (s.y - g) * k);
      ctx.moveTo(px, py + g);
      ctx.lineTo(px, py + g + (vh - s.y - g) * k);
      ctx.stroke();

      // marker (ring over links; drafting circle while drawing)
      ctx.globalAlpha = k;
      ctx.fillStyle = sig;
      ctx.strokeStyle = sig;
      ctx.lineWidth = 1;
      ctx.beginPath();
      if (s.drag) {
        ctx.arc(px, py, 7, 0, Math.PI * 2);
        ctx.stroke();
        ctx.beginPath();
        ctx.arc(px, py, 2, 0, Math.PI * 2);
        ctx.fill();
      } else if (s.link) {
        ctx.arc(px, py, 9, 0, Math.PI * 2);
        ctx.stroke();
      } else {
        ctx.arc(px, py, 3, 0, Math.PI * 2);
        ctx.fill();
      }

      // pins (fade out instead of lingering)
      const life = c.pinLife * 1000;
      pinList = pinList.filter((p) => !life || now - p.t < life);
      for (const p of pinList) {
        const age = now - p.t;
        const a = life ? Math.max(0, 1 - age / life) : 1;
        const fade = a * a * k; // ease-out fade
        ctx.globalAlpha = fade;
        ctx.strokeStyle = sig;
        ctx.fillStyle = sig;
        ctx.lineWidth = 1;
        ctx.beginPath();
        ctx.arc(p.x, p.y, 5, 0, Math.PI * 2);
        ctx.stroke();
        ctx.beginPath();
        ctx.moveTo(p.x - 7, p.y);
        ctx.lineTo(p.x + 7, p.y);
        ctx.moveTo(p.x, p.y - 7);
        ctx.lineTo(p.x, p.y + 7);
        ctx.stroke();
        ctx.fillText(`${Math.round(p.x)}, ${Math.round(p.y)}`, p.x + 9, p.y - 8);
      }

      // measuring (completed measurements fade out after drafting)
      ctx.globalAlpha = 1;
      ctx.lineWidth = 1;
      if (s.drag) drawMeasure([s.sx, s.sy, s.ex, s.ey], 1, true);
      if (done) {
        const age = now - done.t;
        const hold = 1000;
        if (age > hold) done = null;
        else {
          const t = age / hold;
          const fade = Math.max(0, 1 - t * t); // fade continuously, gone after 1s
          drawMeasure(done.a, fade);
        }
      }

      // chip
      const txt = `${s.label ? s.label + "  " : ""}${Math.round(s.x)}, ${Math.round(s.y)}`;
      const w = ctx.measureText(txt).width + 14;
      let cx = s.x + 16;
      let cy = s.y + 16;
      if (cx + w > vw - 4) cx = s.x - 16 - w;
      if (cy + 18 > vh - 4) cy = s.y - 34;
      ctx.globalAlpha = k;
      ctx.fillStyle = ink;
      ctx.fillRect(cx, cy, w, 18);
      ctx.fillStyle = bg;
      ctx.fillText(txt, cx + 7, cy + 13);
      ctx.globalAlpha = 1;
    };
    raf = requestAnimationFrame(draw);

    return () => {
      cancelAnimationFrame(raf);
      window.removeEventListener("pointermove", onMove);
      window.removeEventListener("mousedown", onDown);
      window.removeEventListener("mouseup", onUp);
      window.removeEventListener("keydown", onKey);
      window.removeEventListener("resize", resize);
      document.documentElement.removeEventListener("mouseleave", onLeave);
      document.documentElement.removeEventListener("mouseenter", onEnter);
      document.documentElement.classList.remove("dc-on");
      style?.remove();
    };
  }, [disabled, hideCursor]);

  if (disabled) return null;
  return (
    <canvas
      ref={canvasRef}
      aria-hidden="true"
      className="pointer-events-none fixed inset-0 h-full w-full"
      style={{ zIndex }}
    />
  );
}

export default DraftingCursor;
