import * as THREE from "three";
import { gsap } from "@/lib/gsap";
import { clamp, damp, scrambleCardTags } from "@/lib/animations";
import { MQ_DESKTOP_768, MQ_HOVER, MQ_NARROW_900, MQ_REDUCED_MOTION, mediaMatches } from "@/lib/media";
import {
  CAM_DIST,
  CARD_RADIUS,
  ENTER_RANGE,
  ENTER_SCALE,
  ENTER_SMOOTH,
  IGNORE_REDUCED_MOTION,
  SCALE_FROM_TOP,
} from "../config/scene";
import { fragmentShader, vertexShader } from "../lib/work-scene-shaders";

export type Plane = {
  el: HTMLElement;
  video: HTMLVideoElement;
  tex: THREE.VideoTexture;
  poster: THREE.Texture | null; // shown until the video has a decoded frame
  mesh: THREE.Mesh<THREE.PlaneGeometry, THREE.ShaderMaterial>;
  appear: number | null;
  lastT: number;
  hover: { v: number; target: number; mx: number; my: number; tmx: number; tmy: number };
};

export function initWorkCanvas(root: HTMLElement, canvas: HTMLCanvasElement) {
  const medias = Array.from(root.querySelectorAll<HTMLElement>("[data-media]"));

  /* -------------------------- WebGL setup -------------------------- */
  let renderer: THREE.WebGLRenderer | null = null;
  try {
    renderer = new THREE.WebGLRenderer({
      canvas,
      alpha: true,
      antialias: window.devicePixelRatio < 2,
      powerPreference: "high-performance",
    });
  } catch {
    console.warn("[FeaturedWorks] WebGL unavailable, cards stay flat");
    renderer = null; // no WebGL: DOM videos stay visible
  }

  const planes: Plane[] = [];
  // gsap moves this wrapper, canvas follows it
  const sectionBody = root.querySelector<HTMLElement>("[data-section-body]");
  const canHover = mediaMatches(MQ_HOVER);
  const narrow = mediaMatches(MQ_NARROW_900);
  const mobile = !mediaMatches(MQ_DESKTOP_768);
  let tick: ((time: number, deltaMs: number) => void) | null = null;
  let onResize: (() => void) | null = null;
  const reduceMotion =
    !IGNORE_REDUCED_MOTION && mediaMatches(MQ_REDUCED_MOTION);
  const reduceEffects = reduceMotion || mobile;
  // enough segments for the bend to look smooth
  const geometry = new THREE.PlaneGeometry(1, 1, reduceEffects ? 1 : 40, reduceEffects ? 1 : 40);

  if (renderer) {
    const gl = renderer;
    gl.setClearColor(0x000000, 0);
    const scene = new THREE.Scene();
    const camera = new THREE.PerspectiveCamera(30, 1, 100, 4000);

    onResize = () => {
      const w = window.innerWidth;
      const h = window.innerHeight;
      gl.setPixelRatio(Math.min(window.devicePixelRatio, narrow ? 1.5 : 2));
      gl.setSize(w, h, false);
      // fov so 1 world unit = 1 css px
      camera.fov = (2 * Math.atan(h / 2 / CAM_DIST) * 180) / Math.PI;
      camera.aspect = w / h;
      camera.position.set(0, 0, CAM_DIST);
      camera.updateProjectionMatrix();
    };
    onResize();
    window.addEventListener("resize", onResize);

    const posterLoader = new THREE.TextureLoader();
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
          uAmp: { value: reduceEffects ? 0 : 1 },
        },
      });
      let poster: THREE.Texture | null = null;
      const posterUrl = el.closest<HTMLElement>("[data-work]")?.dataset.poster;
      if (posterUrl) {
        posterLoader.load(posterUrl, (t) => {
          t.minFilter = THREE.LinearFilter;
          t.generateMipmaps = false;
          const entry = planes.find((q) => q.el === el);
          if (entry) entry.poster = t;
          else t.dispose();
        });
      }
      const mesh = new THREE.Mesh(geometry, material);
      mesh.visible = false;
      scene.add(mesh);
      video.style.opacity = "0"; // the canvas draws it now
      const hover = { v: 0, target: 0, mx: 0, my: 0, tmx: 0, tmy: 0 };
      planes.push({ el, video, tex, poster, mesh, appear: null, lastT: -1, hover });

      // hover just affects the texture inside, card itself stays put
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
      let uVel = 0;
      const y = window.scrollY;
      if (!mobile) {
        rawVel += ((y - lastY) / dt - rawVel) * damp(14, dt);
        const target = clamp(rawVel / 2600, -1, 1);
        spring.v += ((target - spring.x) * 120 - spring.v * 22) * dt; // critically damped: eases to flat, no bounce
        spring.x += spring.v * dt;
        uVel = clamp(spring.x, -1.2, 1.2);
      }
      lastY = y;

      /* the section in / out fades the whole wrapper with GSAP; the canvas has to fade with it */
      const bo = sectionBody ? parseFloat(sectionBody.style.opacity) : NaN;
      const bodyAlpha = Number.isNaN(bo) ? 1 : bo;

      for (const p of planes) {
        const r = p.el.getBoundingClientRect();
        const hiddenByTransition = p.el.closest("[data-work]")?.hasAttribute("data-transitioning");
        // video frame when there is one, poster otherwise, so a card never goes blank
        const videoOk = p.video.readyState >= 2;
        const src: THREE.Texture | null = videoOk ? p.tex : p.poster;
        const on =
          !hiddenByTransition && !!src && bodyAlpha > 0.01 && r.bottom > -160 && r.top < vh + 160;
        p.mesh.visible = on;
        if (!on) continue;

        // keep the texture alive: a video that was paused (visibility:hidden, tab / route change,
        // the loader) is restarted, and a frozen VideoTexture is forced to re-upload
        if (p.video.src && p.video.paused && !p.video.ended) p.video.play().catch(() => {});
        if (videoOk && p.video.currentTime !== p.lastT) {
          p.lastT = p.video.currentTime;
          p.tex.needsUpdate = true;
        }

        // entrance: scroll-linked grow on desktop; static on mobile
        let s = 1;
        if (mobile) {
          p.appear = 1;
        } else {
          // measured from the bottom edge (scrolling down) AND the top edge (scrolling up),
          // so the grow-in plays the same in both directions
          const kBottom = clamp((vh - r.top) / (vh * ENTER_RANGE), 0, 1);
          const kTop = SCALE_FROM_TOP ? clamp(r.bottom / (vh * ENTER_RANGE), 0, 1) : 1;
          const k = Math.min(kBottom, kTop);
          const eased = 1 - Math.pow(1 - k, 3);
          if (p.appear === null) p.appear = eased;
          p.appear += (eased - p.appear) * damp(ENTER_SMOOTH, dt);
          s = ENTER_SCALE + (1 - ENTER_SCALE) * p.appear;
        }

        // hover easing (zoom + cursor drift inside the card)
        const h = p.hover;
        h.v += (h.target - h.v) * damp(h.target ? 6 : 4, dt);
        h.mx += (h.tmx - h.mx) * damp(8, dt);
        h.my += (h.tmy - h.my) * damp(8, dt);

        p.mesh.position.set(r.left + r.width / 2 - vw / 2, -(r.top + r.height / 2 - vh / 2), 0);
        p.mesh.scale.set(r.width * s, r.height * s, 1);

        const img = src.image as { width?: number; height?: number } | undefined;
        const va = videoOk && p.video.videoWidth
          ? p.video.videoWidth / p.video.videoHeight
          : img?.width && img?.height ? img.width / img.height : 16 / 9;
        const pa = r.width / r.height;
        const u = p.mesh.material.uniforms;
        u.uTex.value = src;
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

  return {
    planes,
    sectionBody,
    reduceMotion,
    cleanup: () => {
      if (tick) gsap.ticker.remove(tick);
      if (onResize) window.removeEventListener("resize", onResize);
      planes.forEach((p) => {
        p.tex.dispose();
        p.poster?.dispose();
        p.mesh.material.dispose();
        p.video.style.opacity = "";
      });
      geometry.dispose();
      renderer?.dispose();
    },
  };
}
