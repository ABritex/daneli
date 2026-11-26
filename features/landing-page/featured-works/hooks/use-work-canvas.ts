import * as THREE from "three";
import { gsap } from "@/lib/gsap";
import { clamp, damp, scrambleCardTags } from "@/lib/animations";
import { MQ_DESKTOP_768, MQ_HOVER, MQ_NARROW_900, MQ_REDUCED_MOTION, mediaMatches } from "@/lib/media";
import { CAM_DIST, CARD_RADIUS, ENTER_RANGE, ENTER_SCALE, ENTER_SMOOTH, IGNORE_REDUCED_MOTION, SCALE_FROM_TOP } from "../config/scene";
import { fragmentShader, vertexShader } from "../lib/work-scene-shaders";

export type Plane = {
    el: HTMLElement;
    video: HTMLVideoElement | null;
    tex: THREE.Texture;
    poster: THREE.Texture | null; // shown until the video has produced its first frame
    mesh: THREE.Mesh<THREE.PlaneGeometry, THREE.ShaderMaterial>;
    appear: number | null;
    lastT: number;
    hasFrame: boolean; // true once the video/image has produced its first frame; from then on we never fall back to the poster
    aspect: number | null; // last known media aspect, so an unloaded video doesn't change the crop
    hover: { v: number; target: number; mx: number; my: number; tmx: number; tmy: number };
    domFallback: boolean;
    corsChecked: boolean;
};

export type WorkCanvasState = {
    planes: Plane[];
    sectionBody: HTMLElement | null;
    reduceMotion: boolean;
    cleanup: () => void;
};

// three's VideoTexture already re-uploads on every new frame when this exists
const HAS_RVFC = typeof HTMLVideoElement !== "undefined" && "requestVideoFrameCallback" in HTMLVideoElement.prototype;

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
        gl.outputColorSpace = THREE.SRGBColorSpace;
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

        // COLOUR: the shader writes the sampled texel straight to the canvas (no colorspace_fragment). three uploads
        // VIDEO textures as plain RGBA8 (raw sRGB values pass through), but an sRGB-tagged IMAGE texture is uploaded
        // as SRGB8_ALPHA8, so the GPU decodes it to linear and the raw shader never re-encodes it: images come out
        // far too dark. every texture here is therefore NoColorSpace, so images and video share the same raw path.
        const posterLoader = new THREE.TextureLoader();
        posterLoader.setCrossOrigin("anonymous");
        const corsTestCanvas = document.createElement("canvas");
        corsTestCanvas.width = 1;
        corsTestCanvas.height = 1;
        const corsCtx = corsTestCanvas.getContext("2d", { willReadFrequently: true });
        const isCorsClean = (media: HTMLVideoElement | HTMLImageElement) => {
            if (!corsCtx) return false;
            try {
                corsCtx.clearRect(0, 0, 1, 1);
                corsCtx.drawImage(media, 0, 0, 1, 1);
                corsCtx.getImageData(0, 0, 1, 1);
                return true;
            } catch {
                return false;
            }
        };
        medias.forEach((el) => {
            const video = el.querySelector<HTMLVideoElement>("video");
            const img = !video ? el.querySelector<HTMLImageElement>("img") : null;
            if (!video && !img) return;

            let tex: THREE.Texture;
            const hasFrame = false;
            const aspect: number | null = null;
            const poster: THREE.Texture | null = null;
            let domFallback = false;

            if (video) {
                const vt = new THREE.VideoTexture(video);
                vt.minFilter = THREE.LinearFilter;
                vt.magFilter = THREE.LinearFilter;
                vt.generateMipmaps = false;
                vt.colorSpace = THREE.NoColorSpace;
                tex = vt;

                const posterUrl = el.closest<HTMLElement>("[data-work]")?.dataset.poster;
                if (posterUrl) {
                    posterLoader.load(posterUrl, (t) => {
                        t.minFilter = THREE.LinearFilter;
                        t.generateMipmaps = false;
                        t.colorSpace = THREE.NoColorSpace; // same raw space as the video texture, so the swap doesn't pop
                        const entry = planes.find((q) => q.el === el);
                        if (entry) entry.poster = t;
                        else t.dispose();
                    });
                }
            } else {
                const src = img!.currentSrc || img!.src;
                const it = new THREE.Texture();
                it.minFilter = THREE.LinearFilter;
                it.magFilter = THREE.LinearFilter;
                it.generateMipmaps = false;
                it.colorSpace = THREE.NoColorSpace;
                tex = it;

                if (src) {
                    posterLoader.load(
                        src,
                        (t) => {
                            t.minFilter = THREE.LinearFilter;
                            t.magFilter = THREE.LinearFilter;
                            t.generateMipmaps = false;
                            t.colorSpace = THREE.NoColorSpace;
                            const entry = planes.find((q) => q.el === el);
                            if (!entry) {
                                t.dispose();
                                return;
                            }
                            const prev = entry.tex;
                            entry.tex = t;
                            entry.mesh.material.uniforms.uTex.value = t;
                            entry.hasFrame = true;
                            const image = t.image as { width?: number; height?: number } | undefined;
                            if (image?.width && image?.height) entry.aspect = image.width / image.height;
                            img!.style.opacity = "0";
                            if (prev !== t) prev.dispose();
                        },
                        undefined,
                        () => {
                            // CORS/load failure: keep DOM image visible as fallback
                            const entry = planes.find((q) => q.el === el);
                            if (entry) {
                                entry.hasFrame = false;
                                entry.domFallback = true; // the DOM image is what the user sees, so it must get the entrance too
                            }
                            img!.style.opacity = "";
                        },
                    );
                } else {
                    // no source: keep DOM visible and let the DOM fallback animate it
                    domFallback = true;
                }
            }

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
            if (video || hasFrame) (video ?? img!).style.opacity = "0"; // the canvas draws it now
            const hover = { v: 0, target: 0, mx: 0, my: 0, tmx: 0, tmy: 0 };
            planes.push({ el, video, tex, poster, mesh, appear: null, lastT: -1, hasFrame, aspect, hover, domFallback, corsChecked: false });

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
        let tainted = false;
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
                const videoOk = p.video ? p.video.readyState >= 2 : false;
                if (videoOk && p.video) {
                    p.hasFrame = true;
                    if (p.video.videoWidth) p.aspect = p.video.videoWidth / p.video.videoHeight;
                    if (!p.corsChecked) {
                        p.corsChecked = true;
                        if (!isCorsClean(p.video)) {
                            p.domFallback = true;
                            p.video.style.opacity = "";
                        }
                    }
                }
                if (p.domFallback) {
                    p.mesh.visible = false;
                    const mediaEl = p.video ?? p.el.querySelector<HTMLElement>("img, video");
                    if (mediaEl) mediaEl.style.opacity = "";
                    const cr = (p.el.closest<HTMLElement>("[data-work]") ?? p.el).getBoundingClientRect();
                    const on = !hiddenByTransition && bodyAlpha > 0.01 && cr.bottom > -160 && cr.top < vh + 160;
                    if (!on) {
                        p.el.style.transform = "";
                        p.el.style.opacity = "";
                        continue;
                    }
                    anyOn = true;
                    const fk = Math.min(clamp((vh - cr.top) / (vh * ENTER_RANGE), 0, 1), SCALE_FROM_TOP ? clamp(cr.bottom / (vh * ENTER_RANGE), 0, 1) : 1);
                    const fe = 1 - Math.pow(1 - fk, 3);
                    if (p.appear === null) p.appear = fe;
                    p.appear += (fe - p.appear) * damp(ENTER_SMOOTH, dt);
                    p.el.style.transform = `scale(${ENTER_SCALE + (1 - ENTER_SCALE) * p.appear})`;
                    p.el.style.opacity = String(p.appear * bodyAlpha);
                    continue;
                }
                const src: THREE.Texture | null = p.hasFrame ? p.tex : p.poster;
                const on = !hiddenByTransition && !!src && bodyAlpha > 0.01 && r.bottom > -160 && r.top < vh + 160;
                p.mesh.visible = on;
                if (!on) continue;
                anyOn = true;

                // play / pause / retry lives in useLazyVideos now. only browsers without
                // requestVideoFrameCallback need the manual re-upload (otherwise it's a duplicate upload)
                if (p.video && !HAS_RVFC && videoOk && p.video.currentTime !== p.lastT) {
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
                u.uFade.value = p.appear * bodyAlpha;
                u.uHover.value = h.v;
                (u.uMouse.value as THREE.Vector2).set(h.mx, h.my);
                (u.uViewport.value as THREE.Vector2).set(vw, vh);
            }

            // nothing on screen: don't render, and take the full-screen layer out of compositing
            if (anyOn && !tainted) {
                canvas.style.visibility = "";
                try {
                    gl.render(scene, camera);
                } catch {
                    // cross-origin media taints the canvas; fall back to DOM media
                    tainted = true;
                    canvas.style.visibility = "hidden";
                    for (const pl of planes) {
                        pl.domFallback = true;
                        const mediaEl = pl.video ?? pl.el.querySelector<HTMLElement>("img, video");
                        if (mediaEl) mediaEl.style.opacity = "";
                        if (pl.video) {
                            pl.video.muted = true;
                            pl.video.playsInline = true;
                            if (pl.video.paused) pl.video.play().catch(() => {});
                        }
                    }
                    console.warn("[FeaturedWorks] WebGL canvas tainted by cross-origin media, falling back to DOM");
                }
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
                const mediaEl = p.video ?? p.el.querySelector<HTMLElement>("img, video");
                if (mediaEl) mediaEl.style.opacity = "";
                p.el.style.transform = "";
                p.el.style.opacity = "";
            });
            geometry.dispose();
            renderer?.dispose();
        },
    };
}
