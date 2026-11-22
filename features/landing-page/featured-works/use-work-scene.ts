"use client";

import { useEffect, useRef } from "react";
import { gsap } from "gsap";
import { ScrollTrigger } from "gsap/ScrollTrigger";
import * as THREE from "three";
import { clamp, damp, scrambleCardTags } from "@/lib/animations";

gsap.registerPlugin(ScrollTrigger);

/** keep the scroll curve even when the OS asks for reduced motion */
const IGNORE_REDUCED_MOTION = true;
/** where the curve's centre line sits, as a fraction of viewport height (0.5 = middle) */
const CURVE_CENTER = 0.54;
/** how far the top / bottom of the viewport is pulled toward the camera at full speed, as a fraction of viewport height */
const CURVE_DEPTH = 0.08;
/** how quickly the bend saturates with scroll speed (higher = reaches full bend sooner) */
const CURVE_SATURATE = 2.6;
/** vertical tilt while scrolling: how far the outer corners of a card drop (fraction of viewport height) */
const TILT = 0.024;
/** tilt strength for cards in the lower half of the screen, relative to the upper half (they tilt the other way) */
const TILT_LOWER = 0.35;
/** tilt strength when scrolling UP, relative to scrolling down (0 = no tilt going up) */
const TILT_UP = 0.5;
/** prism: how far red and blue are pulled apart at full scroll speed (fraction of the video frame) */
const PRISM = 0.012;
/** motion blur: how far the picture smears along the scroll direction at full speed (fraction of video height) */
const MOTION_BLUR = 0.04;
/** entrance: cards start this fraction of their size and grow to 100% as they enter the viewport */
const ENTER_SCALE = 0.88;
/** entrance: how much of the viewport height the grow-in takes, measured from the bottom edge */
const ENTER_RANGE = 0.42;
/** also scale cards at the TOP edge, so scrolling up grows them in the same way (false = only from the bottom) */
const SCALE_FROM_TOP = true;
/** entrance: smoothing rate (lower = softer / more floaty) */
const ENTER_SMOOTH = 7;
/** hover: how much the picture zooms inside the card (the card itself never moves) */
const HOVER_ZOOM = 0.08;
/** hover: how far the picture drifts with the cursor inside the card (uv units) */
const HOVER_DRIFT = 0.03;
/** corner radius of the cards, in CSS px */
const CARD_RADIUS = 14;

/* ------------------------------------------------------------------ */
/* Shaders                                                             */
/* ------------------------------------------------------------------ */

// The camera is a real perspective camera set up so 1 world unit = 1 CSS px
// on the z = 0 plane.
//
// ONE continuous curve, fixed in SCREEN space (not per card): a parabola whose
// centre line sits near the middle of the viewport. Cards slide through it, so a
// row in the upper half rides one side of the curve and the next row rides the
// other side - the same bend carries on from row to row with no per-card reset.
// Points on the centre line stay put; points toward the top and bottom of the
// viewport are pulled toward the camera, so the sides of every card flare.
//
// uVel is the smoothed scroll speed (0 at rest). The bend grows with speed,
// saturates at high speed. The flare is the same for both scroll directions;
// the tilt (see TILT below) follows the direction.
const vertexShader = /* glsl */ `
  uniform float uVel;
  uniform vec2  uViewport;  // css px
  uniform float uAmp;       // 0 when reduced motion is on
  varying vec2 vUv;
  void main() {
    vUv = uv;
    vec4 wp = modelMatrix * vec4(position, 1.0);

    float screenY = uViewport.y * 0.5 - wp.y;                 // px from top of viewport
    float dyn = (screenY - uViewport.y * ROLLER) / (uViewport.y * 0.5); // -1 top .. +1 bottom

    float amt = uAmp * (1.0 - exp(-SATURATE * abs(uVel)));    // 0 .. 1
    wp.z += amt * uViewport.y * DEPTH * dyn * dyn;

    // TILT: cards ride a wave while scrolling. In the upper part of the screen the
    // outer corners drop below the inner ones, so each card leans toward the centre
    // gutter (left and right cards mirror each other). The lower half does the
    // opposite, more gently. It follows scroll direction: scrolling up eases it back.
    float xn = wp.x / (uViewport.x * 0.5);                    // -1 left .. +1 right
    float dc = clamp(dyn, -1.0, 1.0);
    float wave = dc < 0.0 ? 4.0 * (-dc) * (1.0 + dc)          // peaks halfway up the top half
                          : -__TILT_LOW__ * 4.0 * dc * (1.0 - dc);
    float dir = uVel >= 0.0 ? 1.0 : -__TILT_UP__;
    wp.y -= dir * amt * uViewport.y * __TILT__ * wave * xn * xn;

    gl_Position = projectionMatrix * viewMatrix * wp;
  }
`
  .replace(/ROLLER/g, CURVE_CENTER.toFixed(3))
  .replace(/SATURATE/g, CURVE_SATURATE.toFixed(2))
  .replace(/DEPTH/g, CURVE_DEPTH.toFixed(4))
  .replace(/__TILT_LOW__/g, TILT_LOWER.toFixed(3))
  .replace(/__TILT_UP__/g, TILT_UP.toFixed(3))
  .replace(/__TILT__/g, TILT.toFixed(4));

const fragmentShader = /* glsl */ `
  precision highp float;
  uniform sampler2D uTex;
  uniform vec2 uUvScale;   // "object-fit: cover" crop
  uniform float uFade;     // 0 -> 1 entrance fade
  uniform float uHover;    // 0 -> 1 hover amount (eased in JS)
  uniform vec2  uMouse;    // -1..1 cursor position inside the card
  uniform float uPar;      // -1..1 parallax position
  uniform float uVel;      // scroll velocity (signed)
  uniform float uAmp;      // 0 when reduced motion is on
  uniform vec2 uSize;      // card size in css px
  uniform float uRadius;   // corner radius in css px
  varying vec2 vUv;

  void main() {
    // rounded-rect signed distance, anti-aliased over ~1px
    vec2 p = (vUv - 0.5) * uSize;
    vec2 q = abs(p) - (uSize * 0.5 - uRadius);
    float sdf = length(max(q, 0.0)) + min(max(q.x, q.y), 0.0) - uRadius;
    float edge = 1.0 - smoothstep(-1.0, 0.5, sdf);
    if (edge < 0.01) discard;

    vec2 uv = (vUv - 0.5) * uUvScale;
    uv *= 0.86 - uHover * __HZOOM__;   // zoom a little so parallax never shows an edge; hover zooms in more
    uv.y += uPar * 0.06;
    uv += vec2(uMouse.x, -uMouse.y) * __HDRIFT__ * uHover;   // picture drifts with the cursor, card stays put
    uv += 0.5;

    // 0 at rest (one crisp sample), up to 1 at full scroll speed
    float fx = uAmp * (1.0 - exp(-__SAT__ * abs(uVel)));
    float dir = uVel >= 0.0 ? 1.0 : -1.0;

    vec3 col;
    if (fx < 0.01) {
      col = texture2D(uTex, uv).rgb;
    } else {
      // prism: red and blue are pulled apart along the scroll direction and a little
      // outward from the card centre, so the fringes fan out toward the edges
      vec2 c = vUv - 0.5;
      vec2 split = vec2(c.x * 0.8, dir * 0.6 + c.y * 0.6) * fx * __PRISM__;

      // motion blur: soft taps spread along the scroll direction
      vec3 acc = vec3(0.0);
      float wsum = 0.0;
      for (int i = 0; i < 9; i++) {
        float t = float(i) / 4.0 - 1.0;            // -1 .. 1
        float w = exp(-t * t * 2.2);
        vec2 o = vec2(0.0, t * fx * __BLUR__);
        acc.r += w * texture2D(uTex, uv + o + split).r;
        acc.g += w * texture2D(uTex, uv + o).g;
        acc.b += w * texture2D(uTex, uv + o - split).b;
        wsum += w;
      }
      col = acc / wsum;
    }
    gl_FragColor = vec4(col, edge * uFade);
  }
`
  .replace(/__SAT__/g, CURVE_SATURATE.toFixed(2))
  .replace(/__PRISM__/g, PRISM.toFixed(4))
  .replace(/__BLUR__/g, MOTION_BLUR.toFixed(4))
  .replace(/__HZOOM__/g, HOVER_ZOOM.toFixed(4))
  .replace(/__HDRIFT__/g, HOVER_DRIFT.toFixed(4));

type Plane = {
  el: HTMLElement;
  video: HTMLVideoElement;
  tex: THREE.VideoTexture;
  mesh: THREE.Mesh<THREE.PlaneGeometry, THREE.ShaderMaterial>;
  /** entrance amount 0..1 (scroll linked, smoothed) */
  appear: number | null;
  /** hover amount + cursor, each eased toward its target every frame */
  hover: { v: number; target: number; mx: number; my: number; tmx: number; tmy: number };
};

const CAM_DIST = 1200;

/** Runs `cb` once the page loader has finished (or immediately if it never ran). */
function onLoaderReady(cb: () => void): () => void {
  const root = document.documentElement;
  const ready = () => {
    const s = root.dataset.loader;
    return !s || s === "done" || s === "skip";
  };
  let fired = false;
  const fire = () => {
    if (fired || !ready()) return;
    fired = true;
    mo.disconnect();
    window.removeEventListener("daneli-loader-done", fire);
    cb();
  };
  const mo = new MutationObserver(fire);
  mo.observe(root, { attributes: true, attributeFilter: ["data-loader"] });
  window.addEventListener("daneli-loader-done", fire);
  fire();
  return () => {
    fired = true;
    mo.disconnect();
    window.removeEventListener("daneli-loader-done", fire);
  };
}

/**
 * The featured-works scene.
 *  - every card is the same size, on an even 2-column grid
 *  - the videos are drawn on ONE shared fixed canvas with a perspective camera
 *  - scroll velocity runs through a spring: cards bow, shear and tilt along one
 *    continuous curve, then settle with a little overshoot
 *  - cards grow in from a slightly smaller size as they enter the viewport (scroll linked)
 *  - hover only animates the picture INSIDE the card (zoom + cursor drift) - the card never moves
 *  - all smoothing is time-based, so it feels the same at 60 / 120 / 144 Hz
 *  - heavy work (WebGL, video loading) starts only after the loader finishes
 *  - if WebGL is unavailable the plain <video> elements are shown instead
 */
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

          for (const p of planes) {
            const r = p.el.getBoundingClientRect();
            const hiddenByTransition = p.el.closest("[data-work]")?.hasAttribute("data-transitioning");
            const on = !hiddenByTransition && r.bottom > -160 && r.top < vh + 160 && p.video.readyState >= 2;
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
            u.uFade.value = 0.35 + 0.65 * p.appear;
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
