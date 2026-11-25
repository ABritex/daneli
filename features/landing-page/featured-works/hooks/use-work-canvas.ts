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
  poster: THREE.Texture | null; // shown until the video has produced its first frame
  mesh: THREE.Mesh<THREE.PlaneGeometry, THREE.ShaderMaterial>;
  appear: number | null;
  lastT: number;
  hasFrame: boolean; // true once the video has decoded a frame; from then on we never fall back to the poster
  aspect: number | null; // last known video aspect, so an unloaded video doesn't change the crop
  hover: { v: number; target: number; mx: number; my: number; tmx: number; tmy: number };
};

export type WorkCanvasState = {
  planes: Plane[];
  sectionBody: HTMLElement | null;
  reduceMotion: boolean;
  cleanup: () => void;
};

// three's VideoTexture already re-uploads on every new frame when this exists
const HAS_RVFC =
  typeof HTMLVideoElement !== "undefined" && "requestVideoFrameCallback" in HTMLVideoElement.prototype;

export function initWorkCanvas(root: HTMLElement, canvas: HTMLCanvasElement): WorkCanvasState {
  const sectionBody = root.querySelector<HTMLElement>("[data-section-body]");

  /* ------------------ phones: no WebGL, plain <video> cards ------------------
     the canvas is positioned from JS after the browser has already scrolled the DOM, so on touch
     devices (compositor-thread scrolling) the cards always trail their titles. the shader effects
     are off on mobile anyway, so the DOM <video> is both faster and perfectly in sync. */
  if (!mediaMatches(MQ_DESKTOP_768)) {
    const prevDisplay = canvas.style.display;
    canvas.style.display = "none";
    return {
      planes: [],
      sectionBody,
      reduceMotion: false,
      cleanup: () => {
        canvas.style.display = prevDisplay;
      },
    };
  }

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
  const canHover = mediaMatches(MQ_HOVER);
  const narrow = mediaMatches(MQ_NARROW_900);
  let tick: ((time: number, deltaMs: number) => void) | null = null;
  let onResize: (() => void) | null = null;
  const reduceMotion = !IGNORE_REDUCED_MOTION && mediaMatches(MQ_REDUCED_MOTION);
  // enough segments for the bend to look smooth
  const geometry = new THREE.PlaneGeometry(1, 1, reduceMotion ? 1 : 40, reduceMotion ? 1 : 40);

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
      tex.colorSpace = THREE.SRGBColorSpace;

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
      let poster: THREE.Texture | null = null;
      const posterUrl = el.closest<HTMLElement>("[data-work]")?.dataset.poster;
      if (posterUrl) {
        posterLoader.load(posterUrl, (t) => {
          t.minFilter = THREE.LinearFilter;
          t.generateMipmaps = false;
          t.colorSpace = THREE.SRGBColorSpace; // same space as the video, so the swap doesn't pop
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
      planes.push({ el, video, tex, poster, mesh, appear: null, lastT: -1, hasFrame: false, aspect: null, hover });

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
      const y = window.scrollY;
      rawVel += ((y - lastY) / dt - rawVel) * damp(14, dt);
      const target = clamp(rawVel / 2600, -1, 1);
      spring.v += ((target - spring.x) * 120 - spring.v * 22) * dt; // critically damped: eases to flat, no bounce
      spring.x += spring.v * dt;
      const uVel = clamp(spring.x, -1.2, 1.2);
      lastY = y;

      /* the section in / out fades the whole wrapper with GSAP; the canvas has to fade with it */
      const bo = sectionBody ? parseFloat(sectionBody.style.opacity) : NaN;
      const bodyAlpha = Number.isNaN(bo) ? 1 : bo;

      let anyOn = false;
      for (const p of planes) {
        const r = p.el.getBoundingClientRect();
        const hiddenByTransition = p.el.closest("[data-work]")?.hasAttribute("data-transitioning");

        // once the video has produced a frame we keep drawing the video texture (it holds the last
        // frame), so a loop restart, a seek or an unload never flashes the poster or a blank card
        const videoOk = p.video.readyState >= 2;
        if (videoOk) {
          p.hasFrame = true;
          if (p.video.videoWidth) p.aspect = p.video.videoWidth / p.video.videoHeight;
        }
        const src: THREE.Texture | null = p.hasFrame ? p.tex : p.poster;
        const on =
          !hiddenByTransition && !!src && bodyAlpha > 0.01 && r.bottom > -160 && r.top < vh + 160;
        p.mesh.visible = on;
        if (!on) continue;
        anyOn = true;

        // play / pause / retry lives in useLazyVideos now. only browsers without
        // requestVideoFrameCallback need the manual re-upload (otherwise it's a duplicate upload)
        if (!HAS_RVFC && videoOk && p.video.currentTime !== p.lastT) {
          p.lastT = p.video.currentTime;
          p.tex.needsUpdate = true;
        }

        // entrance: scroll-linked grow, measured from the bottom edge (scrolling down) AND the top
        // edge (scrolling up), so the grow-in plays the same in both directions
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

        const img = src.image as { width?: number; height?: number } | undefined;
        const va = p.aspect ?? (img?.width && img?.height ? img.width / img.height : 16 / 9);
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

      // nothing on screen: don't render, and take the full-screen layer out of compositing
      if (anyOn) {
        canvas.style.visibility = "";
        gl.render(scene, camera);
      } else {
        canvas.style.visibility = "hidden";
      }
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
      canvas.style.visibility = "";
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
