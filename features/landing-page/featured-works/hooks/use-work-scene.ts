"use client";

import { useEffect, useRef } from "react";
import { gsap } from "gsap";
import { ScrollTrigger } from "gsap/ScrollTrigger";
import * as THREE from "three";
import { clamp, damp, scrambleCardTags } from "@/lib/animations";
import {
  CAM_DIST,
  CARD_RADIUS,
  ENTER_RANGE,
  ENTER_SCALE,
  ENTER_SMOOTH,
  IGNORE_REDUCED_MOTION,
  IN_END,
  IN_RISE,
  IN_START,
  OUT_END,
  OUT_LIFT,
  OUT_START,
  SCALE_FROM_TOP,
} from "../config/scene";
import { onLoaderReady } from "../lib/on-loader-ready";
import { fragmentShader, vertexShader } from "../lib/work-scene-shaders";

gsap.registerPlugin(ScrollTrigger);

type Plane = {
  el: HTMLElement;
  video: HTMLVideoElement;
  tex: THREE.VideoTexture;
  mesh: THREE.Mesh<THREE.PlaneGeometry, THREE.ShaderMaterial>;
  appear: number | null;
  hover: { v: number; target: number; mx: number; my: number; tmx: number; tmy: number };
};

// main hook for the featured works canvas scene
export function useWorkScene() {
  const rootRef = useRef<HTMLElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);

  // lazy-load + play / pause videos by visibility (after the loader)
  useEffect(() => {
    const root = rootRef.current;
    if (!root) return;
    let io: IntersectionObserver | null = null;
    const stop = onLoaderReady(() => {
      io = new IntersectionObserver(
        (entries) => {
          for (const entry of entries) {
            const v = entry.target as HTMLVideoElement;
            if (entry.isIntersecting) {
              if (!v.src && v.dataset.src) {
                v.src = v.dataset.src;
                v.load();
              }
              v.play().catch(() => {});
            } else {
              v.pause();
            }
          }
        },
        { rootMargin: "400px 0px" },
      );
      root.querySelectorAll<HTMLVideoElement>("video").forEach((v) => io!.observe(v));
    });
    return () => {
      stop();
      io?.disconnect();
    };
  }, []);

  useEffect(() => {
    const root = rootRef.current;
    const canvas = canvasRef.current;
    if (!root || !canvas) return;

    let teardown: (() => void) | undefined;

    const init = () => {
      const medias = Array.from(root.querySelectorAll<HTMLElement>("[data-media]"));

      /* -------------------------- WebGL setup -------------------------- */
      let renderer: THREE.WebGLRenderer | null = null;
      try {
        renderer = new THREE.WebGLRenderer({
          canvas,
          alpha: true,
          antialias: true,
          powerPreference: "high-performance",
        });
      } catch {
        console.warn("[FeaturedWorks] WebGL unavailable, cards stay flat");
        renderer = null; // no WebGL: DOM videos stay visible
      }

      const planes: Plane[] = [];
      /* GSAP fades / moves this wrapper for the section in / out; the canvas planes mirror it below */
      const sectionBody = root.querySelector<HTMLElement>("[data-section-body]");
      const canHover = window.matchMedia("(hover: hover)").matches;
      let tick: ((time: number, deltaMs: number) => void) | null = null;
      let onResize: (() => void) | null = null;
      const reduceMotion =
        !IGNORE_REDUCED_MOTION && window.matchMedia("(prefers-reduced-motion: reduce)").matches;
      // dense enough in both directions to carry the bend smoothly
      const geometry = new THREE.PlaneGeometry(1, 1, 40, 40);

      if (renderer) {
        const gl = renderer;
        gl.setClearColor(0x000000, 0);
        const scene = new THREE.Scene();
        const camera = new THREE.PerspectiveCamera(30, 1, 100, 4000);

        onResize = () => {
          const w = window.innerWidth;
          const h = window.innerHeight;
          gl.setPixelRatio(Math.min(window.devicePixelRatio, 2));
          gl.setSize(w, h, false);
          // fov chosen so the z = 0 plane maps 1 world unit to 1 css px
          camera.fov = (2 * Math.atan(h / 2 / CAM_DIST) * 180) / Math.PI;
          camera.aspect = w / h;
          camera.position.set(0, 0, CAM_DIST);
          camera.updateProjectionMatrix();
        };
        onResize();
        window.addEventListener("resize", onResize);

        medias.forEach((el) => {
          const video = el.querySelector<HTMLVideoElement>("video");
          if (!video) return;
          const tex = new THREE.VideoTexture(video);
          tex.minFilter = THREE.LinearFilter;
          tex.magFilter = THREE.LinearFilter;
          tex.generateMipmaps = false;

          const material = new THREE.ShaderMaterial({
            vertexShader,
            fragmentShader,
            transparent: true,
            uniforms: {
              uSize: { value: new THREE.Vector2(1, 1) },
              uRadius: { value: CARD_RADIUS },
              uTex: { value: tex },
              uUvScale: { value: new THREE.Vector2(1, 1) },
              uFade: { value: 1 },
              uHover: { value: 0 },
              uMouse: { value: new THREE.Vector2(0, 0) },
              uPar: { value: 0 },
              uVel: { value: 0 },
              uViewport: { value: new THREE.Vector2(1, 1) },
              uAmp: { value: reduceMotion ? 0 : 1 },
            },
          });
          const mesh = new THREE.Mesh(geometry, material);
          mesh.visible = false;
          scene.add(mesh);
          video.style.opacity = "0"; // the canvas draws it now
          const hover = { v: 0, target: 0, mx: 0, my: 0, tmx: 0, tmy: 0 };
          planes.push({ el, video, tex, mesh, appear: null, hover });

          // hover only changes what is drawn INSIDE the card; the card never transforms
          if (canHover) {
            const card = el.closest("[data-work]");
            const setMouse = (e: PointerEvent) => {
              const r = el.getBoundingClientRect();
              hover.tmx = clamp(((e.clientX - r.left) / r.width) * 2 - 1, -1, 1);
              hover.tmy = clamp(((e.clientY - r.top) / r.height) * 2 - 1, -1, 1);
            };
            el.addEventListener("pointerenter", (e) => {
              hover.target = 1;
              setMouse(e);
              scrambleCardTags(card);
            });
            el.addEventListener("pointermove", setMouse);
            el.addEventListener("pointerleave", () => {
              hover.target = 0;
              hover.tmx = 0;
              hover.tmy = 0;
            });
          }
        });

        let lastY = window.scrollY;
        let rawVel = 0; // px / s, low-passed
        const spring = { x: 0, v: 0 };

        tick = (_time, deltaMs) => {
          const dt = Math.min(deltaMs / 1000, 0.05) || 1 / 60;
          const vw = window.innerWidth;
          const vh = window.innerHeight;

          /* scroll velocity -> low-pass -> spring */
          const y = window.scrollY;
          rawVel += ((y - lastY) / dt - rawVel) * damp(14, dt);
          lastY = y;
          const target = clamp(rawVel / 2600, -1, 1);
          spring.v += ((target - spring.x) * 120 - spring.v * 22) * dt; // critically damped: eases to flat, no bounce
          spring.x += spring.v * dt;
          const uVel = clamp(spring.x, -1.2, 1.2);

          /* the section in / out fades the whole wrapper with GSAP; the canvas has to fade with it */
          const bo = sectionBody ? parseFloat(sectionBody.style.opacity) : NaN;
          const bodyAlpha = Number.isNaN(bo) ? 1 : bo;

          for (const p of planes) {
            const r = p.el.getBoundingClientRect();
            const hiddenByTransition = p.el.closest("[data-work]")?.hasAttribute("data-transitioning");
            const on =
              !hiddenByTransition && bodyAlpha > 0.01 && r.bottom > -160 && r.top < vh + 160 && p.video.readyState >= 2;
            p.mesh.visible = on;
            if (!on) continue;

            // entrance: scroll-linked grow from a slightly smaller card, softened by damping
            // measured from the bottom edge (scrolling down) AND the top edge (scrolling up),
            // so the grow-in plays the same in both directions
            const kBottom = clamp((vh - r.top) / (vh * ENTER_RANGE), 0, 1);
            const kTop = SCALE_FROM_TOP ? clamp(r.bottom / (vh * ENTER_RANGE), 0, 1) : 1;
            const k = Math.min(kBottom, kTop);
            const eased = 1 - Math.pow(1 - k, 3);
            if (p.appear === null) p.appear = eased;
            p.appear += (eased - p.appear) * damp(ENTER_SMOOTH, dt);
            const s = ENTER_SCALE + (1 - ENTER_SCALE) * p.appear;

            // hover easing (zoom + cursor drift inside the card)
            const h = p.hover;
            h.v += (h.target - h.v) * damp(h.target ? 6 : 4, dt);
            h.mx += (h.tmx - h.mx) * damp(8, dt);
            h.my += (h.tmy - h.my) * damp(8, dt);

            p.mesh.position.set(r.left + r.width / 2 - vw / 2, -(r.top + r.height / 2 - vh / 2), 0);
            p.mesh.scale.set(r.width * s, r.height * s, 1);

            const va = p.video.videoWidth ? p.video.videoWidth / p.video.videoHeight : 16 / 9;
            const pa = r.width / r.height;
            const u = p.mesh.material.uniforms;
            (u.uUvScale.value as THREE.Vector2).set(va > pa ? pa / va : 1, va > pa ? 1 : va / pa);
            (u.uSize.value as THREE.Vector2).set(r.width * s, r.height * s);

            const centre = r.top + r.height / 2 - vh / 2;
            u.uPar.value = clamp(centre / (vh / 2 + r.height / 2), -1, 1);
            u.uVel.value = uVel;
            u.uFade.value = (0.35 + 0.65 * p.appear) * bodyAlpha;
            u.uHover.value = h.v;
            (u.uMouse.value as THREE.Vector2).set(h.mx, h.my);
            (u.uViewport.value as THREE.Vector2).set(vw, vh);
          }
          gl.render(scene, camera);
        };
        // runs after Lenis (which is added with priority) so planes never lag the DOM
        gsap.ticker.add(tick);
      }

      /* ------------------------ GSAP scroll effects ------------------------ */
      const mm = gsap.matchMedia();
      mm.add(
        "(prefers-reduced-motion: no-preference)",
        () => {
          /* whole-section transition, scrubbed to the scroll position (reverses when you scroll back).
             IN starts while the hero is still dissolving; OUT overlaps About drawing itself in */
          if (sectionBody) {
            gsap
              .timeline({
                scrollTrigger: { trigger: root, start: IN_START, end: IN_END, scrub: 1 },
              })
              .fromTo(sectionBody, { y: IN_RISE, opacity: 0 }, { y: 0, opacity: 1, ease: "power3.out", duration: 1 });

            gsap
              .timeline({
                scrollTrigger: { trigger: root, start: OUT_START, end: OUT_END, scrub: 1 },
              })
              .fromTo(
                sectionBody,
                { y: 0, opacity: 1 },
                { y: -OUT_LIFT, opacity: 0, ease: "power2.in", duration: 1, immediateRender: false },
              );
          }

          gsap.fromTo(
            "[data-rule]",
            { scaleX: 0 },
            {
              scaleX: 1,
              duration: 1.2,
              ease: "power3.inOut",
              transformOrigin: "left center",
              scrollTrigger: { trigger: "[data-rule]", start: "top 92%", once: true },
            },
          );

          gsap.utils.toArray<HTMLElement>("[data-work]", root).forEach((card) => {
            const media = card.querySelector<HTMLElement>("[data-media]");
            const title = card.querySelector<HTMLElement>("[data-title]");
            const meta = card.querySelector<HTMLElement>("[data-meta]");
            if (!media || !title || !meta) return;

            // with WebGL the entrance is scroll-linked inside the render loop;
            // only the plain <video> fallback needs a tween
            const plane = planes.find((p) => p.el === media);
            if (!plane) {
              gsap.fromTo(
                media,
                { scale: ENTER_SCALE, opacity: 0.35 },
                {
                  scale: 1,
                  opacity: 1,
                  duration: 1.4,
                  ease: "expo.out",
                  scrollTrigger: { trigger: card, start: "top 92%", once: true },
                },
              );
            }

            gsap.fromTo(
              title,
              { yPercent: 110 },
              {
                yPercent: 0,
                duration: 1,
                ease: "power4.out",
                scrollTrigger: { trigger: card, start: "top 80%", once: true },
              },
            );
            gsap.fromTo(
              meta,
              { opacity: 0, y: 10 },
              {
                opacity: 1,
                y: 0,
                duration: 0.8,
                delay: 0.15,
                ease: "power2.out",
                onStart: () => scrambleCardTags(card),
                scrollTrigger: { trigger: card, start: "top 80%", once: true },
              },
            );
          });
        },
        root,
      );

      const refresh = () => ScrollTrigger.refresh();
      document.fonts?.ready.then(refresh);
      const raf = requestAnimationFrame(refresh);

      return () => {
        cancelAnimationFrame(raf);
        mm.revert();
        if (tick) gsap.ticker.remove(tick);
        if (onResize) window.removeEventListener("resize", onResize);
        planes.forEach((p) => {
          p.tex.dispose();
          p.mesh.material.dispose();
          p.video.style.opacity = "";
        });
        geometry.dispose();
        renderer?.dispose();
      };
    };

    // WebGL, textures and ScrollTriggers are created only after the loader is gone,
    // so the loader animation never competes with shader compilation.
    const stop = onLoaderReady(() => {
      teardown = init();
    });

    return () => {
      stop();
      teardown?.();
    };
  }, []);

  return { rootRef, canvasRef };
}