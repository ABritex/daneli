"use client";

import { useEffect, useRef } from "react";
import { MQ_NARROW_900, MQ_REDUCED_MOTION, mediaMatches } from "@/lib/media";

/* Burst particles only: tiny white dots leave the centre in random 3D directions,
   grow slightly as they travel, then respawn at the centre. Same camera as the
   Three.js scene (fov 75, camera z 10, 14 on narrow portrait screens). */

const PARTICLE_COUNT = 140;
const SIZE = 0.16; /* overall particle size, 1 = the old size. lower = smaller */
const MAX_RADIUS_PX = 1.3; /* hard cap on a dot's radius in px */
const SPEED = 0.5; /* 1 = original speed, lower = slower */
const FOV = 75;
const FPS_REF = 60; /* the original steps per frame; scaled by dt so it matches at any refresh rate */
const IGNORE_REDUCED_MOTION = true;

type Particle = {
    x: number;
    y: number;
    z: number;
    vx: number; /* per-frame velocity at 60fps */
    vy: number;
    vz: number;
    life: number; /* lifetime units, drops 0.01 per frame */
};

export function SpaceBackground() {
    const canvasRef = useRef<HTMLCanvasElement>(null);

    useEffect(() => {
        const canvas = canvasRef.current;
        if (!canvas) return;
        const ctx = canvas.getContext("2d");
        if (!ctx) return;

        const narrow = mediaMatches(MQ_NARROW_900);
        const dpr = Math.min(window.devicePixelRatio || 1, narrow ? 1.5 : 2);
        const count = narrow ? 70 : PARTICLE_COUNT;
        const reduce = !IGNORE_REDUCED_MOTION && mediaMatches(MQ_REDUCED_MOTION);

        let raf = 0;
        let w = 0;
        let h = 0;
        let f = 1; /* focal length in px */
        let camZ = 10;
        let last = performance.now();

        const spawn = (p: Particle, age = 0) => {
            p.vx = (Math.random() * 2 - 1) * 0.1;
            p.vy = (Math.random() * 2 - 1) * 0.1;
            p.vz = (Math.random() * 2 - 1) * 0.1;
            const life0 = Math.random() * 2 + 1;
            /* age (seconds) lets the first frame start with a spread-out burst instead of all at the centre */
            p.x = p.vx * FPS_REF * age;
            p.y = p.vy * FPS_REF * age;
            p.z = p.vz * FPS_REF * age;
            p.life = life0 - 0.01 * FPS_REF * age;
            return p;
        };

        const particles: Particle[] = Array.from({ length: count }, () => {
            const p = { x: 0, y: 0, z: 0, vx: 0, vy: 0, vz: 0, life: 0 };
            const ttl = (Math.random() * 2 + 1) / (0.01 * FPS_REF);
            return spawn(p, Math.random() * ttl * 0.9);
        });

        const resize = () => {
            w = window.innerWidth;
            h = window.innerHeight;
            canvas.width = Math.floor(w * dpr);
            canvas.height = Math.floor(h * dpr);
            canvas.style.width = `${w}px`;
            canvas.style.height = `${h}px`;
            ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
            camZ = w / h < 0.8 ? 14 : 10;
            f = h / 2 / Math.tan((FOV / 2) * (Math.PI / 180));
        };

        const draw = (dt: number) => {
            ctx.clearRect(0, 0, w, h);
            ctx.fillStyle = "#fff";
            const k = dt * FPS_REF * SPEED;

            for (const p of particles) {
                p.x += p.vx * k;
                p.y += p.vy * k;
                p.z += p.vz * k;
                p.life -= 0.01 * k;
                if (p.life <= 0) {
                    spawn(p);
                    continue;
                }

                const depth = camZ - p.z;
                if (depth < 0.5) continue; /* flew past the camera */

                const dist = Math.hypot(p.x, p.y, p.z);
                const scale = Math.min(dist * 0.5, 3);
                const r = Math.min((0.05 * scale * SIZE * f) / depth, MAX_RADIUS_PX);
                if (r < 0.12) continue;

                ctx.globalAlpha = Math.min(p.life, 0.5) / 0.5; /* soft fade at the end instead of popping */
                ctx.beginPath();
                ctx.arc(w / 2 + (p.x / depth) * f, h / 2 - (p.y / depth) * f, r, 0, Math.PI * 2);
                ctx.fill();
            }
            ctx.globalAlpha = 1;
        };

        const minFrameMs = narrow ? 1000 / 30 : 0;
        let acc = 0;
        const tick = (now: number) => {
            raf = window.requestAnimationFrame(tick);
            if (document.hidden) {
                last = now;
                acc = 0;
                return;
            }
            const dt = Math.min((now - last) / 1000, 0.05);
            last = now;
            if (minFrameMs) {
                acc += dt * 1000;
                if (acc < minFrameMs) return;
                acc = 0;
            }
            draw(dt);
        };

        resize();
        window.addEventListener("resize", resize);
        if (reduce) {
            draw(0);
        } else {
            raf = window.requestAnimationFrame(tick);
        }

        return () => {
            window.removeEventListener("resize", resize);
            window.cancelAnimationFrame(raf);
        };
    }, []);

    return <canvas ref={canvasRef} aria-hidden="true" className="pointer-events-none fixed inset-0 z-0 h-full w-full" />;
}
