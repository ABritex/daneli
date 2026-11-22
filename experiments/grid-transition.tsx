"use client";

import { useEffect, useRef } from "react";

type GridConfig = {
  direction: "diagonal" | "up" | "right" | "down" | "left";
  speed: number;
  squareSize: number;
  shape: "square" | "hexagon" | "circle" | "triangle";
  borderColor: string;
  hoverFillColor: string;
  vignetteColor: string;
  hoverTrailAmount: number;
};

class GridDrawer {
  ctx: CanvasRenderingContext2D;
  config: GridConfig;
  width = 0;
  height = 0;
  hoverX = -9999;
  hoverY = -9999;
  hoverTrail: { x: number; y: number; life: number }[] = [];

  constructor(ctx: CanvasRenderingContext2D, config: GridConfig) {
    this.ctx = ctx;
    this.config = config;
  }

  resize(canvas: HTMLCanvasElement) {
    const dpr = Math.min(window.devicePixelRatio || 1, 2);
    this.width = canvas.width = canvas.clientWidth * dpr;
    this.height = canvas.height = canvas.clientHeight * dpr;
    this.ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
  }

  trackHover(x: number, y: number) {
    this.hoverX = x;
    this.hoverY = y;
    this.hoverTrail.push({ x, y, life: 1 });
    if (this.hoverTrail.length > (this.config.hoverTrailAmount || 0)) {
      this.hoverTrail.shift();
    }
  }

  clearHover() {
    this.hoverX = -9999;
    this.hoverY = -9999;
    this.hoverTrail = [];
  }

  tick() {
    const ctx = this.ctx;
    const { width, height } = this;
    const c = this.config;

    ctx.clearRect(0, 0, width, height);

    // vignette
    const grad = ctx.createRadialGradient(
      width / 2,
      height / 2,
      width * 0.3,
      width / 2,
      height / 2,
      width * 0.9,
    );
    grad.addColorStop(0, "transparent");
    grad.addColorStop(1, c.vignetteColor);
    ctx.fillStyle = grad;
    ctx.fillRect(0, 0, width, height);

    const size = c.squareSize;
    const time = Date.now() / 1000 * c.speed;
    const cols = Math.ceil(width / size) + 1;
    const rows = Math.ceil(height / size) + 1;

    ctx.strokeStyle = c.borderColor;
    ctx.lineWidth = 1;

    // draw grid
    ctx.beginPath();
    for (let i = 0; i <= cols; i++) {
      const x = i * size;
      ctx.moveTo(x, 0);
      ctx.lineTo(x, height);
    }
    for (let j = 0; j <= rows; j++) {
      const y = j * size;
      ctx.moveTo(0, y);
      ctx.lineTo(width, y);
    }
    ctx.stroke();

    // hover trails
    this.hoverTrail.forEach((t) => {
      const alpha = t.life;
      ctx.fillStyle = c.hoverFillColor.replace(/[\d.]+\)$/, `${alpha * 0.15})`);
      ctx.beginPath();
      if (c.shape === "circle") {
        ctx.arc(t.x, t.y, size * 0.4 * alpha, 0, Math.PI * 2);
      } else if (c.shape === "hexagon") {
        const r = size * 0.4 * alpha;
        ctx.moveTo(t.x + r, t.y);
        for (let s = 1; s <= 6; s++) {
          const angle = (s * Math.PI) / 3;
          ctx.lineTo(t.x + r * Math.cos(angle), t.y + r * Math.sin(angle));
        }
      } else if (c.shape === "triangle") {
        const r = size * 0.4 * alpha;
        ctx.moveTo(t.x, t.y - r);
        ctx.lineTo(t.x + r * Math.sqrt(3) / 2, t.y + r / 2);
        ctx.lineTo(t.x - r * Math.sqrt(3) / 2, t.y + r / 2);
      } else {
        const r = size * 0.4 * alpha;
        ctx.rect(t.x - r / 2, t.y - r / 2, r, r);
      }
      ctx.fill();
      t.life -= 0.02;
    });
    this.hoverTrail = this.hoverTrail.filter((t) => t.life > 0);

    // moving grid lines based on direction
    const offsetX = (Math.sin(time) * width * 0.05) * (c.direction === "right" || c.direction === "left" ? 1 : 0);
    const offsetY = (Math.cos(time) * height * 0.05) * (c.direction === "up" || c.direction === "down" ? 1 : 0);

    ctx.strokeStyle = c.borderColor;
    ctx.lineWidth = 1;
    ctx.beginPath();
    for (let i = 0; i <= cols; i++) {
      const x = (i * size + offsetX) % (width + size) - size * 0.5;
      ctx.moveTo(x, 0);
      ctx.lineTo(x, height);
    }
    for (let j = 0; j <= rows; j++) {
      const y = (j * size + offsetY) % (height + size) - size * 0.5;
      ctx.moveTo(0, y);
      ctx.lineTo(width, y);
    }
    ctx.stroke();

    // hover pulse
    if (this.hoverX > -9000) {
      ctx.fillStyle = c.hoverFillColor;
      ctx.beginPath();
      ctx.arc(this.hoverX, this.hoverY, size * 0.6, 0, Math.PI * 2);
      ctx.fill();
    }
  }
}

export function GridTransition({
  visible,
  direction = "right",
  speed = 1,
  squareSize = 40,
  shape = "square",
  hoverTrailAmount = 0,
}: {
  visible: boolean;
  direction?: "diagonal" | "up" | "right" | "down" | "left";
  speed?: number;
  squareSize?: number;
  shape?: "square" | "hexagon" | "circle" | "triangle";
  hoverTrailAmount?: number;
}) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const drawerRef = useRef<GridDrawer | null>(null);
  const frameRef = useRef<number | null>(null);

  const mountedRef = useRef(false);

  useEffect(() => {
    mountedRef.current = true;
  }, []);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    const config: GridConfig = {
      direction,
      speed,
      squareSize,
      shape,
      borderColor: "rgba(0,0,0,0.06)",
      hoverFillColor: "rgba(0,0,0,0.12)",
      vignetteColor: "rgba(0,0,0,0.85)",
      hoverTrailAmount,
    };

    const drawer = new GridDrawer(ctx, config);
    drawerRef.current = drawer;

    drawer.resize(canvas);

    const handleResize = () => drawer.resize(canvas);
    window.addEventListener("resize", handleResize);

    const handleMouseMove = (e: MouseEvent) => {
      const rect = canvas.getBoundingClientRect();
      drawer.trackHover(e.clientX - rect.left, e.clientY - rect.top);
    };
    const handleMouseLeave = () => drawer.clearHover();

    canvas.addEventListener("mousemove", handleMouseMove);
    canvas.addEventListener("mouseleave", handleMouseLeave);

    const loop = () => {
      if (visible) {
        drawer.tick();
        frameRef.current = requestAnimationFrame(loop);
      }
    };
    frameRef.current = requestAnimationFrame(loop);

    return () => {
      window.removeEventListener("resize", handleResize);
      canvas.removeEventListener("mousemove", handleMouseMove);
      canvas.removeEventListener("mouseleave", handleMouseLeave);
      if (frameRef.current) cancelAnimationFrame(frameRef.current);
    };
  }, [visible, direction, speed, squareSize, shape, hoverTrailAmount]);

  return (
    <canvas
      ref={canvasRef}
      className="w-full h-full border-none block fixed inset-0 z-[9997] pointer-events-none"
      style={{ display: visible ? "block" : "none" }}
    />
  );
}

export default GridTransition;
