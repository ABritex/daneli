import { useEffect, type RefObject } from "react";
import * as THREE from "three";
import { GLTFLoader } from "three/examples/jsm/loaders/GLTFLoader.js";
import { ART, ART_MOBILE } from "../config/art";
import {
  ADAPTIVE_DPR,
  AUTO_SPEED,
  CAM_DIST,
  CARD_RADIUS,
  CARD_TILT,
  CARDS_PER_TURN,
  CENTER_SCALE,
  EDGE_BLUR,
  EDGE_FADE,
  EXIT_TRAVEL,
  GLIDE_MS,
  IGNORE_REDUCED_MOTION,
  LAND_FROM,
  MAX_DPR,
  MIN_DPR,
  MORPH_STAGGER,
  N,
  PAUSE_ON_HOVER,
  SETTLE_FORWARD_P,
  SETTLE_IDLE_MS,
  SNAP_P,
  SPIN_P_CAP,
  SPIRAL_CARD_H,
  SPIRAL_CARD_W,
  SPIRAL_DIM,
  SPIRAL_PERSPECTIVE,
  SPIRAL_RADIUS,
  SPIRAL_ROTATION,
  SPIRAL_SCALE,
  SPIRAL_V_SPACING,
  SCROLL_SPIN,
  TRANSITION_END,
  TRANSITION_START,
  WALL_COLUMNS,
  WALL_DEPTH,
  WALL_DIM,
  WALL_EXIT_RISE,
  WALL_FILL,
  WALL_ITEMS_PER_COL,
  WALL_PARALLAX_MAX_DEG,
  WALL_PERSP_LOSS,
  WALL_RECENTER,
  WALL_SCALE,
  WALL_SCALE_MAX,
  WALL_SCROLL_BOOST_FACTOR,
  WALL_SCROLL_BOOST_MAX,
  WALL_SPEED,
  WALL_TILE_W,
  WALL_TILT,
  WALL_TURN,
  WALL_VARIANCE,
} from "../config/config";
import { attachBlur, NO_BLUR, NO_SHAPE, setBlur } from "../lib/material";
import type { LenisLike, SpiralCard, WallTile } from "../config/types";
import { clamp, colFactor, mod, setCover, smooth } from "../lib/utils";

type Refs = {
  canvasRef: RefObject<HTMLCanvasElement | null>;
  stageRef: RefObject<HTMLDivElement | null>;
  wrapperRef: RefObject<HTMLDivElement | null>;
  heroOverlayRef: RefObject<HTMLDivElement | null>;
  heroMetaRef: RefObject<HTMLDivElement | null>;
  reelsHeadingRef: RefObject<HTMLDivElement | null>;
  reelsMetaRef: RefObject<HTMLDivElement | null>;
  reelsVideoRef: RefObject<HTMLDivElement | null>;
  vignetteRef: RefObject<HTMLDivElement | null>;
  exitRef: RefObject<HTMLDivElement | null>;
};

export function useHeroSection({
  canvasRef,
  stageRef,
  wrapperRef,
  heroOverlayRef,
  heroMetaRef,
  reelsHeadingRef,
  reelsMetaRef,
  reelsVideoRef,
  vignetteRef,
  exitRef,
}: Refs) {
  useEffect(() => {
    const canvas = canvasRef.current;
    const stage = stageRef.current;
    const wrapper = wrapperRef.current;
    if (!canvas || !stage || !wrapper) return;

    const motionQuery = window.matchMedia("(prefers-reduced-motion: reduce)");
    let reduceMotion = !IGNORE_REDUCED_MOTION && motionQuery.matches;
    const coarsePointer = window.matchMedia("(pointer: coarse)").matches;
    const narrow = window.matchMedia("(max-width: 900px)").matches;
    const art = narrow ? ART_MOBILE : ART;
    const maxDpr = narrow ? 1.5 : MAX_DPR;
    const onMotionChange = (event: MediaQueryListEvent) => {
      reduceMotion = !IGNORE_REDUCED_MOTION && event.matches;
    };
    motionQuery.addEventListener("change", onMotionChange);

    let renderer: THREE.WebGLRenderer | null = null;
    let dprCap = Math.min(window.devicePixelRatio, maxDpr);
    let dpr = dprCap;
    let frameEma = 16.7;
    let dprCooldown = 0;
    let lastDrop = 0;
    let raiseWait = 6000;
    let frame = 0;
    let disposed = false;
    let lastTime = performance.now();
    let spinProgress = 0;
    let targetSpin = 0;
    let spiralAuto = 0;
    let spiralHover = false;
    let hasPointer = false;
    const raycaster = new THREE.Raycaster();
    const pointerNdc = new THREE.Vector2();
    let dragging = false;
    let dragY = 0;
    let spiralRow: number = SPIRAL_V_SPACING;

    const textures: THREE.Texture[] = [];
    const spiralCards: SpiralCard[] = [];
    let mannequin: THREE.Group | null = null; /* pivot group: float / turn the whole body here */
    /* procedural pose: the model ships a skeleton but no animation clips, so we drive the bones ourselves */
    const bones: Record<string, { bone: THREE.Bone; rest: THREE.Quaternion }> = {};
    const poseEuler = new THREE.Euler();
    const poseQuat = new THREE.Quaternion();
    let mannequinBaseY = 0;

    let wallTilesByItem: WallTile[][] = Array.from({ length: N }, () => []);
    let wallTracks: THREE.Group[] = [];
    let wallColsMeta: Array<{ ch: number }> = [];
    let wallOffsets: number[] = [];
    let wallVels: number[] = [];
    let wallBaseV: number[] = [];
    let wallAllTiles: WallTile[] = [];
    let builtW = 0;
    let builtH = 0;
    const pointer = new THREE.Vector2(0, 0);
    const pointerDamped = new THREE.Vector2(0, 0);
    let lastScrollY = window.scrollY;
    let scrollVel = 0;

    let gliding = false;
    let glideFrame = 0;
    let lastBeyond = 0;
    let cooldownUntil = 0;
    let touching = false;
    let lastMoveAt = performance.now();
    let exitP = 0;
    let exitT = 0; /* 0..1 over the whole exit: the pinned tail AND the stage scrolling out */
    let lastHeroO = -1;
    let lastHeroS = -1;
    let lastMetaO = -1;
    let lastReelsO = -1;
    let lastVigO = -1;
    let lastExitY = 1e9;
    let lastCursor = "";
    let spiralIntro = 0; // 0 = hidden/loading, 1 = fully in
    let spiralIntroStart = -1;
    let assetsReady = false; /* gltf + textures decoded, uploaded to the GPU and shaders compiled */

    let morphLock: Array<WallTile | null> | null = null;
    const morphKi = new Float32Array(N);
    const lockPos = Array.from({ length: N }, () => new THREE.Vector3());
    const lockSeen = new Uint8Array(N);
    const lockTmp = new THREE.Vector3();
    let wallBase = WALL_SCALE;
    const spiralPos = new THREE.Vector3();
    const spiralScale = new THREE.Vector3();
    const targetPos = new THREE.Vector3();
    const targetQuat = new THREE.Quaternion();
    const targetScale = new THREE.Vector3();
    /* three.js z is counter-clockwise, css rotateZ is clockwise, hence the minus */
    const tiltQuat = new THREE.Quaternion().setFromAxisAngle(
      new THREE.Vector3(0, 0, 1),
      -(CARD_TILT * Math.PI) / 180,
    );
    const MORPH_ARC = 160;

    try {
      renderer = new THREE.WebGLRenderer({
        canvas,
        alpha: true,
        antialias: window.devicePixelRatio < 2, /* MSAA at 2x is a big fill-rate cost for little gain */
        depth: true, /* the mannequin writes depth (so limbs/torso occlude correctly); cards/tiles still have depthWrite:false and use renderOrder */
        stencil: false,
        powerPreference: "high-performance",
      });
    } catch {
      return;
    }

    renderer.setClearColor(0x000000, 0);
    renderer.outputColorSpace = THREE.SRGBColorSpace;

    const scene = new THREE.Scene();
    const camera = new THREE.PerspectiveCamera(30, 1, 100, 5000);
    const wallGroup = new THREE.Group();
    wallGroup.visible = false;
    wallGroup.rotation.order = "XYZ";
    scene.add(wallGroup);

    const ambientLight = new THREE.AmbientLight(0xffffff, 0.9);
    scene.add(ambientLight);
    const dirLight = new THREE.DirectionalLight(0xffffff, 1.2);
    dirLight.position.set(2, 3, 4);
    scene.add(dirLight);

    // loader waits for all this before it opens
    (window as unknown as { __heroReady?: boolean }).__heroReady = false;
    const pending: Promise<void>[] = [];

    const gltfLoader = new GLTFLoader();
    pending.push(
      new Promise<void>((resolve) => {
    // keep mobile model in sync if mannequin changes
    const modelUrl = narrow ? "/manniquin/scene-mobile.gltf" : "/manniquin/scene.gltf";
    gltfLoader.load(
      modelUrl, /* scene.bin is shared; mobile swaps in 1024² textures */
      (gltf) => {
        if (disposed) {
          resolve();
          return;
        }
        const obj = gltf.scene;
        obj.traverse((child) => {
          const mesh = child as THREE.Mesh;
          if (mesh.isMesh) {
            mesh.frustumCulled = false;
            mesh.renderOrder = 9000000; /* draw last: on top of the spiral cards (2000000+) and wall tiles */
            const mat = mesh.material as THREE.MeshStandardMaterial | THREE.MeshStandardMaterial[];
            const mats = Array.isArray(mat) ? mat : [mat];
            for (const m of mats) {
              if (!m) continue;
              m.transparent = true;
              m.opacity = 0;
              m.depthWrite = true;
              m.depthTest = true;
              m.needsUpdate = true;
            }
          }
          /* index the bones by a cleaned-up name: "Arm.R_08" -> "armr08" */
          const bone = child as THREE.Bone;
          if (bone.isBone) {
            const key = bone.name.toLowerCase().replace(/[._\s]/g, "");
            bones[key] = { bone, rest: bone.quaternion.clone() };
          }
        });

        const box = new THREE.Box3().setFromObject(obj);
        const size = new THREE.Vector3();
        const center = new THREE.Vector3();
        box.getSize(size);
        const maxDim = Math.max(size.x, size.y, size.z, 1);
        const targetH = 520;
        obj.scale.setScalar(targetH / maxDim);

        box.setFromObject(obj);
        box.getCenter(center);
        obj.position.sub(center);

        /* pivot at the middle of the body so turning / floating doesn't swing it off-centre */
        const holder = new THREE.Group();
        holder.add(obj);
        mannequin = holder;
        mannequinBaseY = holder.position.y;
        scene.add(holder);
        resolve();
      },
      undefined,
      (err) => {
        resolve(); /* never hang the loader on a missing model */
        console.error("[hero] mannequin failed to load (expects /public/manniquin/scene.gltf, scene.bin, textures/):", err);
      },
    );
      }),
    );

    const loader = new THREE.TextureLoader();
    const bySrc = new Map<string, THREE.Texture>(); /* same image = one texture / one GPU upload */
    const aniso = Math.min(4, renderer.capabilities.getMaxAnisotropy());
    for (const src of art) {
      let tex = bySrc.get(src);
      if (!tex) {
        /* upload as soon as the image arrives instead of on the first frame it is drawn
           (that upload landed right in the middle of the morph) */
        let done!: () => void;
        pending.push(new Promise<void>((r) => { done = r; }));
        tex = loader.load(
          src,
          (t) => {
            renderer?.initTexture(t);
            done();
          },
          undefined,
          () => done(),
        );
        tex.colorSpace = THREE.SRGBColorSpace;
        /* mipmaps: big photos drawn at ~200px were sampled without them (slow + shimmering) */
        tex.generateMipmaps = true;
        tex.minFilter = THREE.LinearMipmapLinearFilter;
        tex.magFilter = THREE.LinearFilter;
        tex.anisotropy = aniso;
        bySrc.set(src, tex);
      }
      textures.push(tex);
    }

    const geometry = new THREE.PlaneGeometry(1, 1);
    for (let i = 0; i < N; i++) {
      const material = new THREE.MeshBasicMaterial({
        map: textures[i],
        transparent: true,
        opacity: 1,
        depthWrite: false,
      });
      const blur = new THREE.Vector2(0, 0);
      const shape = new THREE.Vector4(0, 0, 0, 1);
      const cover = new THREE.Vector2(1, 1);
      attachBlur(material, blur, shape, cover);
      const mesh = new THREE.Mesh(geometry, material);
      mesh.frustumCulled = false;
      scene.add(mesh);
      spiralCards.push({ mesh, index: i, blur, shape, cover });
    }

    const spiralMeshes = spiralCards.map((c) => c.mesh);

    /* once everything has arrived: push the model's textures to the GPU and compile every shader
       now, so the first visible frame doesn't hitch (this is what hurt weak PCs), then tell the
       loader it can open */
    Promise.all(pending).then(async () => {
      const r = renderer;
      if (disposed || !r) return;
      try {
        mannequin?.traverse((child) => {
          const mesh = child as THREE.Mesh;
          if (!mesh.isMesh) return;
          const mat = mesh.material as THREE.Material | THREE.Material[];
          for (const m of Array.isArray(mat) ? mat : [mat]) {
            if (!m) continue;
            for (const v of Object.values(m)) {
              if ((v as THREE.Texture | null)?.isTexture) r.initTexture(v as THREE.Texture);
            }
          }
        });
        const rc = r as THREE.WebGLRenderer & { compileAsync?: (s: THREE.Object3D, c: THREE.Camera) => Promise<unknown> };
        if (rc.compileAsync) await rc.compileAsync(scene, camera);
        else r.compile(scene, camera);
      } catch {
        /* warm-up is best effort */
      }
      if (disposed) return;
      assetsReady = true;
      (window as unknown as { __heroReady?: boolean }).__heroReady = true;
      window.dispatchEvent(new Event("daneli-hero-ready"));
    });

    const clearWall = () => {
      for (const tile of wallAllTiles) {
        tile.mesh.removeFromParent();
        tile.mesh.material.dispose();
      }
      wallTracks = [];
      wallAllTiles = [];
      wallTilesByItem = Array.from({ length: N }, () => []);
      wallColsMeta = [];
      wallOffsets = [];
      wallVels = [];
      wallBaseV = [];
      morphLock = null;
      morphKi.fill(0);
      wallGroup.clear();
    };

    const buildWall = () => {
      const w = stage.clientWidth;
      const h = stage.clientHeight;
      if (w <= 0 || h <= 0) return;
      clearWall();

      const tileW = w < 700 ? 150 : WALL_TILE_W;
      const tileH = Math.round(tileW * 0.66);
      const gap = 18;
      const unit = tileH + gap;

      /* same column count as React Bits; the wall is made bigger (WALL_SCALE) and the vignette
         fades whatever edge is left, rather than adding columns */
      const columns = w < 700 ? 3 : WALL_COLUMNS;
      /* make the tiles as big as it takes for the wall to span the stage (the vignette then fades
         the outer edge) instead of adding columns */
      wallBase = clamp(
        (w * WALL_FILL) / (WALL_PERSP_LOSS * columns * (tileW + gap)),
        WALL_SCALE,
        WALL_SCALE_MAX,
      );

      /* every column cycles through its own slice of the items, offset from its neighbours,
         so a wide wall doesn't repeat the same few images in every row */
      const perCol = Math.min(N, WALL_ITEMS_PER_COL);
      const cols: number[][] = Array.from({ length: columns }, (_, ci) =>
        Array.from({ length: perCol }, (_, j) => (ci * perCol + j) % N),
      );

      for (let ci = 0; ci < columns; ci++) {
        const col = cols[ci];
        const ch = Math.max(unit, col.length * unit);
        const copies = Math.max(3, Math.ceil((h * 2.4) / ch) + 1);
        const total = copies * ch; /* full height of the column, centred on the track */
        wallColsMeta.push({ ch });
        wallOffsets.push(ch * ((ci * 0.37) % 1));
        wallVels.push(0);
        wallBaseV.push(
          WALL_SPEED * colFactor(ci, WALL_VARIANCE) * (ci % 2 === 0 ? 1 : -1),
        );

        const track = new THREE.Group();
        track.position.x = (ci - (columns - 1) / 2) * (tileW + gap);
        wallGroup.add(track);
        wallTracks.push(track);

        for (let cp = 0; cp < copies; cp++) {
          for (let j = 0; j < col.length; j++) {
            const item = col[j];
            const idx = cp * col.length + j;
            const material = new THREE.MeshBasicMaterial({
              map: textures[item],
              transparent: true,
              opacity: WALL_DIM,
              depthWrite: false,
            });
            const tileCover = new THREE.Vector2(1, 1);
            attachBlur(material, NO_BLUR, NO_SHAPE, tileCover);
            const mesh = new THREE.Mesh(geometry, material);
            mesh.frustumCulled = true; /* ~half the column copies are off screen: skip those draws */
            mesh.position.y = total / 2 - (idx * unit + unit / 2);
            mesh.scale.set(tileW, tileH, 1);
            mesh.userData.wallTile = { item, col: ci };
            track.add(mesh);
            const tile: WallTile = {
              item,
              col: ci,
              mesh,
              baseZ: 0,
              cover: tileCover,
              coverKey: -1,
              lastOpacity: -1,
            };
            wallAllTiles.push(tile);
            wallTilesByItem[item].push(tile);
          }
        }
      }

      wallGroup.scale.setScalar(wallBase);
      wallGroup.userData.getWallTarget = getWallTarget;
      wallGroup.userData.wallTilesByItem = wallTilesByItem;
      wallGroup.userData.wallAllTiles = wallAllTiles;
    };

    const getWallTarget = (item: number) => {
      const tiles = wallTilesByItem[item];
      if (!tiles || tiles.length === 0) return null;
      wallGroup.updateWorldMatrix(true, true);
      camera.updateMatrixWorld();
      /* fan the cards out over the whole screen (golden-ratio spread) instead of all landing
         near the centre, so the morph uses the full width of the wall */
      const dx = ((item * 0.6180339887) % 1) * 1.6 - 0.8;
      const dy = ((item * 0.3819660113 + 0.2) % 1) * 1.3 - 0.65;
      let best: WallTile | null = null;
      let bestD = Infinity;
      const ndc = new THREE.Vector3();
      for (const tile of tiles) {
        ndc.setFromMatrixPosition(tile.mesh.matrixWorld); /* world matrices were just updated above */
        ndc.project(camera);
        if (ndc.z < -1 || ndc.z > 1) continue;
        const d = (ndc.x - dx) * (ndc.x - dx) + (ndc.y - dy) * (ndc.y - dy);
        if (d < bestD) {
          bestD = d;
          best = tile;
        }
      }
      return best ?? tiles[0];
    };

    const resize = () => {
      if (!renderer) return;
      const w = stage.clientWidth;
      const h = stage.clientHeight;
      if (w <= 0 || h <= 0) return;
      dprCap = Math.min(window.devicePixelRatio, maxDpr);
      dpr = Math.min(dpr, dprCap);
      renderer.setPixelRatio(dpr);
      renderer.setSize(w, h, false);
      camera.aspect = w / h;
      camera.fov = (2 * Math.atan(h / 2 / CAM_DIST) * 180) / Math.PI;
      camera.position.set(0, 0, CAM_DIST);
      camera.updateProjectionMatrix();
      if (Math.abs(w - builtW) > 1 || Math.abs(h - builtH) > 80 || wallTracks.length === 0) {
        builtW = w;
        builtH = h;
        buildWall();
      }
    };

    /* keeps the morph smooth on weaker GPUs: when the frame time EMA stays high, step the canvas
       resolution down; step back up only after a (growing) quiet period so it can't flip-flop */
    const adaptDpr = (frameMs: number, now: number) => {
      if (!ADAPTIVE_DPR || !renderer || frameMs > 100) return; /* ignore tab switches / one-off hitches */
      frameEma += (frameMs - frameEma) * 0.08;
      if (now < dprCooldown) return;
      let next = dpr;
      if (frameEma > 24 && dpr > MIN_DPR) {
        next = Math.max(MIN_DPR, dpr - 0.25);
        raiseWait = Math.min(raiseWait * 2, 60000);
        lastDrop = now;
      } else if (frameEma < 18.5 && dpr < dprCap && now - lastDrop > raiseWait) {
        next = Math.min(dprCap, dpr + 0.25);
      }
      if (next === dpr) return;
      dpr = next;
      dprCooldown = now + 1200;
      renderer.setPixelRatio(dpr);
      renderer.setSize(stage.clientWidth, stage.clientHeight, false);
    };

    const updateSpiral = (
      w: number,
      h: number,
      K: number,
      motionReduced: boolean,
      intro: number,
    ) => {
      const cardWidth = SPIRAL_CARD_W * SPIRAL_SCALE;
      const cardHeight = SPIRAL_CARD_H * SPIRAL_SCALE;
      const fit = Math.min(1, w / (cardWidth * 2.8), h / (cardHeight * 2.35));
      const radius = Math.min(SPIRAL_RADIUS * SPIRAL_SCALE, Math.max(72, w * 0.36)) * fit;
      const rowPx = SPIRAL_V_SPACING * SPIRAL_SCALE * fit;
      spiralRow = rowPx;
      const half = N / 2;
      const fadeStart = clamp(1 - EDGE_FADE, 0, 0.98);
      const visibleHalf = Math.min(half, ((h / 2) / Math.max(rowPx, 1)) * 1.1);

      for (let i = 0; i < spiralCards.length; i++) {
        const { mesh, index, blur, shape, cover } = spiralCards[i];
        const offset = mod(i - spinProgress + half, N) - half;
        /* normalise against what is actually on screen. with 15 cards the old |offset|/half
           never got past ~0.45 inside the viewport, so nothing ever faded or blurred */
        const edge = Math.min(Math.abs(offset) / Math.max(visibleHalf, 1), 1);
        const spiralOpacity = 1 - smooth(fadeStart, 1, edge);
        const focus =
          1 - Math.min(Math.abs(offset) / Math.max(CARDS_PER_TURN * 0.65, 1), 1);
        const baseScale = (1 + (CENTER_SCALE - 1) * focus) * fit;
        /* same curve as the React Bits spiral: blur ramps up toward the faded top/bottom cards */
        const blurPx = EDGE_BLUR * smooth(0.35, 1, edge);

        const angle =
          ((offset * (360 / CARDS_PER_TURN) + SPIRAL_ROTATION) * Math.PI) / 180;
        const sx = Math.sin(angle) * radius;
        const sz = Math.cos(angle) * radius;
        const sy = -(offset * rowPx);

        const persp = CAM_DIST / Math.max(CAM_DIST - sz, 1);
        const yNorm = clamp((sy / persp) / (h * 0.5), -1, 1);
        const revealOrder = (yNorm + 1) / 2; // 0 = bottom, 1 = top
        const cardIntro = smooth(revealOrder * 0.72, revealOrder * 0.72 + 0.28, intro);
        /* React Bits translates cards in the screen plane (x/y are NOT shrunk by depth) and only
           scales the card itself by the depth factor. here the camera really is a perspective
           camera, so divide by persp to land on exactly those screen-space numbers */
        const refDepth = clamp(
          SPIRAL_PERSPECTIVE / Math.max(SPIRAL_PERSPECTIVE - sz, 1),
          0.72,
          1.45,
        );
        spiralPos.set(sx / persp, sy / persp, sz);
        spiralScale.set(
          (cardWidth * baseScale * refDepth) / persp,
          (cardHeight * baseScale * refDepth) / persp,
          1,
        );

        const ki = morphKi[index] ?? 0;
        const locked = morphLock?.[index] ?? null;

        if (K > 0 && locked) {
          /* world matrices are refreshed once per frame in render(); read them directly
             (getWorld* each re-walked the whole parent chain, 3x per card) */
          locked.mesh.matrixWorld.decompose(targetPos, targetQuat, targetScale);

          const t = ki * ki * (3 - 2 * ki);
          mesh.position.lerpVectors(spiralPos, targetPos, t);
          mesh.scale.lerpVectors(spiralScale, targetScale, t);
          mesh.quaternion.slerpQuaternions(tiltQuat, targetQuat, t);

          if (!motionReduced) {
            const arc = Math.sin(ki * Math.PI) * MORPH_ARC;
            mesh.position.z += arc;
          }

          /* each card dims to the wall's own brightness as it lands, then hands off to its
             tile. before, every card faded on one shared timer while some were still
             mid-flight, so ghost tiles appeared at the destination before the card did */
          const land = smooth(LAND_FROM, 1, ki);
          const opacity = (spiralOpacity + (WALL_DIM - spiralOpacity) * t) * (1 - land) * cardIntro;
          mesh.material.opacity = opacity;
          mesh.material.color.setScalar(SPIRAL_DIM + (1 - SPIRAL_DIM) * t);
          mesh.visible = opacity > 0.001;
          setBlur(blur, blurPx * (1 - t), mesh.scale); /* the spiral's blur only: cards sharpen as they leave it */
          shape.set(cardWidth, cardHeight, CARD_RADIUS * (1 - t), mesh.scale.x / cardWidth);
          setCover(cover, textures[index], mesh.scale.x / Math.max(mesh.scale.y, 1e-3));
          mesh.renderOrder = 2000000 + i;
        } else {
          mesh.position.copy(spiralPos);
          mesh.scale.copy(spiralScale);
          mesh.quaternion.copy(tiltQuat);
          mesh.material.opacity = spiralOpacity * cardIntro;
          mesh.material.color.setScalar(SPIRAL_DIM);
          setBlur(blur, blurPx, mesh.scale);
          shape.set(cardWidth, cardHeight, CARD_RADIUS, mesh.scale.x / cardWidth);
          setCover(cover, textures[index], mesh.scale.x / Math.max(mesh.scale.y, 1e-3));
          mesh.visible = spiralOpacity * cardIntro > 0.001;
          mesh.renderOrder =
            Math.round(((sz / Math.max(radius, 1) + 1) / 2) * 100000) + i;
        }
      }
    };

    /* the original wall is CSS (y points down); three.js has y pointing up, so the X tilt flips sign.
       no extra scroll-linked rotation: the wall keeps one steady pose, like the React Bits original */
    const applyWallPose = () => {
      wallGroup.rotation.x = -THREE.MathUtils.degToRad(WALL_TILT + pointerDamped.y);
      wallGroup.rotation.y = THREE.MathUtils.degToRad(WALL_TURN + pointerDamped.x);
      wallGroup.rotation.z = 0;
      const wallScale = wallBase * (1 + exitP * 0.1);
      /* the CSS original does translateZ(-depth) *after* scale + rotate, so the wall is pushed back
         along its own tilted normal (and by the scale), not straight down the camera axis */
      wallGroup.position
        .set(0, 0, -WALL_DEPTH * wallScale)
        .applyEuler(wallGroup.rotation);
      wallGroup.position.x -= stage.clientWidth * WALL_RECENTER * (wallBase / WALL_SCALE);
      wallGroup.position.z += exitP * 80;
      wallGroup.position.y += exitP * WALL_EXIT_RISE;
      wallGroup.scale.setScalar(wallScale);
    };

    /* columns wrap with mod(), which teleports every tile in the column by one period.
       a card locked to a tile would be yanked across the screen when that happens, so when a
       locked tile jumps we re-lock to the identical copy (same item, same column) that sits
       nearest to where it was */
    const keepLocksContinuous = () => {
      if (!morphLock) return;
      for (let i = 0; i < N; i++) {
        const tile = morphLock[i];
        if (!tile) continue;
        lockTmp.setFromMatrixPosition(tile.mesh.matrixWorld);
        if (lockSeen[i] && lockTmp.distanceTo(lockPos[i]) > 90) {
          let best = tile;
          let bestD = Infinity;
          for (const cand of wallTilesByItem[i]) {
            if (cand.col !== tile.col) continue;
            lockTmp.setFromMatrixPosition(cand.mesh.matrixWorld);
            const d = lockTmp.distanceTo(lockPos[i]);
            if (d < bestD) {
              bestD = d;
              best = cand;
            }
          }
          morphLock[i] = best;
          lockTmp.setFromMatrixPosition(best.mesh.matrixWorld);
        }
        lockPos[i].copy(lockTmp);
        lockSeen[i] = 1;
      }
    };

    const updateWall = (
      p: number,
      K: number,
      dt: number,
      motionReduced: boolean,
    ) => {
      const wallAlpha = K * (1 - 0.95 * smooth(0.05, 1, exitT));
      wallGroup.visible = wallAlpha > 0.001;
      /* pose is applied even while hidden so the morph targets are picked from the real tilted wall */
      applyWallPose();

      if (!wallGroup.visible) return;

      if (motionReduced) {
        pointerDamped.set(0, 0);
      } else {
        const damp = 1 - Math.exp(-dt / 0.12);
        pointerDamped.x += (pointer.x * WALL_PARALLAX_MAX_DEG - pointerDamped.x) * damp;
        pointerDamped.y += (-pointer.y * WALL_PARALLAX_MAX_DEG - pointerDamped.y) * damp;
      }

      applyWallPose();

      /* no scroll boost while gliding / morphing: the glide's scroll velocity is huge and was
         speeding the wall up right as the cards tried to land on it */
      const boost = motionReduced || gliding || K < 1
        ? 0
        : clamp(scrollVel * WALL_SCROLL_BOOST_FACTOR, -WALL_SCROLL_BOOST_MAX, WALL_SCROLL_BOOST_MAX);

      for (let ci = 0; ci < wallTracks.length; ci++) {
        const track = wallTracks[ci];
        const meta = wallColsMeta[ci];
        if (!track || !meta) continue;

        if (motionReduced) {
          wallVels[ci] = 0;
        } else {
          const target = wallBaseV[ci] + boost;
          wallVels[ci] += (target - wallVels[ci]) * (1 - Math.exp(-dt / 0.28));
          wallOffsets[ci] = mod(wallOffsets[ci] + wallVels[ci] * dt, meta.ch);
        }

        track.position.y = wallOffsets[ci];
      }

      for (const tile of wallAllTiles) {
        /* the crop only depends on the image size (tile scale is fixed): recompute on load, not every frame */
        const img = textures[tile.item].image as { width?: number; height?: number } | undefined;
        const key = (img?.width ?? 0) * 100003 + (img?.height ?? 0);
        if (key !== tile.coverKey) {
          setCover(tile.cover, textures[tile.item], tile.mesh.scale.x / tile.mesh.scale.y);
          tile.coverKey = key;
        }
        /* empty until this image's spiral card lands; every copy of the image fills in as it does */
        const filled = smooth(LAND_FROM, 1, morphKi[tile.item]);
        const o = WALL_DIM * wallAlpha * filled;
        if (Math.abs(o - tile.lastOpacity) > 0.0005) {
          tile.mesh.material.opacity = o;
          tile.lastOpacity = o;
          tile.mesh.visible = o > 0.002; /* fully faded tiles aren't drawn at all */
        }
      }
    };

    const onPointerMove = (event: PointerEvent) => {
      if (dragging) {
        const dy = event.clientY - dragY;
        dragY = event.clientY;
        targetSpin -= dy / Math.max(spiralRow, 1);
      }
      const rect = stage.getBoundingClientRect();
      if (rect.width <= 0 || rect.height <= 0) return;
      pointer.set(
        clamp((event.clientX - rect.left) / rect.width - 0.5, -0.5, 0.5),
        clamp((event.clientY - rect.top) / rect.height - 0.5, -0.5, 0.5),
      );
      pointerNdc.set(
        ((event.clientX - rect.left) / rect.width) * 2 - 1,
        -(((event.clientY - rect.top) / rect.height) * 2 - 1),
      );
      hasPointer = true;
    };

    const onPointerDown = (e: PointerEvent) => {
      if (reduceMotion || e.button !== 0 || e.pointerType === "touch") return;
      if (metrics().p >= TRANSITION_START) return; /* only the spiral is draggable */
      dragging = true;
      dragY = e.clientY;
    };
    const onPointerUp = () => {
      dragging = false;
    };
    const onPointerLeave = () => {
      spiralHover = false;
      hasPointer = false;
      pointer.set(0, 0);
    };

    /* ---------- snap glide: hero <-> reels ---------- */
    const metrics = () => {
      const rect = wrapper.getBoundingClientRect();
      const range = Math.max(wrapper.offsetHeight - window.innerHeight, 1);
      return {
        rectTop: rect.top,
        top: rect.top + window.scrollY,
        range,
        p: clamp(-rect.top / range, 0, 1),
      };
    };

    const glideTo = (targetP: number) => {
      if (gliding) return;
      const m = metrics();
      const from = window.scrollY;
      const to = m.top + targetP * m.range;
      gliding = true;
      const done = () => {
        gliding = false;
        cooldownUntil = performance.now() + 400;
      };
      const lenis = (window as unknown as { __lenis?: LenisLike }).__lenis;
      const start = performance.now();
      const step = (now: number) => {
        if (disposed) return;
        const x = clamp((now - start) / GLIDE_MS, 0, 1);
        /* gentle sine ease: the old cubic had a very slow start and a very fast middle */
        const e = 0.5 - 0.5 * Math.cos(Math.PI * x);
        const y = from + (to - from) * e;
        if (lenis) lenis.scrollTo(y, { immediate: true, force: true });
        else window.scrollTo({ top: y, behavior: "instant" as ScrollBehavior });
        if (x < 1) {
          glideFrame = window.requestAnimationFrame(step);
        } else {
          done();
        }
      };
      glideFrame = window.requestAnimationFrame(step);
    };

    const cancelGlide = () => {
      if (!gliding) return;
      gliding = false;
      window.cancelAnimationFrame(glideFrame);
      glideFrame = 0;
    };

    /* true when the gesture started a glide */
    const decide = (dir: 1 | -1): boolean => {
      if (reduceMotion || coarsePointer || gliding) return false;
      if (document.documentElement.dataset.loader === "playing") return false;
      const m = metrics();
      if (dir > 0 && m.rectTop <= 2 && m.p < SNAP_P - 0.004) {
        glideTo(SNAP_P);
        return true;
      }
      if (
        dir < 0 &&
        m.p > SNAP_P - 0.08 &&
        m.p <= SNAP_P + 0.012 &&
        performance.now() - lastBeyond > 350
      ) {
        glideTo(0);
        return true;
      }
      return false;
    };



    const onWheel = (e: WheelEvent) => {
      if (reduceMotion) return;
      const now = performance.now();
      if (document.documentElement.dataset.loader === "playing") return;
      if (gliding) {
        e.preventDefault();
        e.stopImmediatePropagation();
        cooldownUntil = Math.max(cooldownUntil, now + 400);
        return;
      }
      if (now < cooldownUntil) {
        // after a snap, block only the reverse direction briefly; don't trap scroll down to featured
        const dir = e.deltaY > 0 ? 1 : -1;
        const m = metrics();
        const reversingUp = dir < 0 && m.p >= SNAP_P - 0.02;
        if (reversingUp) {
          e.preventDefault();
          e.stopImmediatePropagation();
        }
        return;
      }
      if (Math.abs(e.deltaY) < 4) return;
      if (decide(e.deltaY > 0 ? 1 : -1)) {
        e.preventDefault();
        e.stopImmediatePropagation();
      }
    };
    const onTouchStart = () => {
      cancelGlide();
      touching = true;
    };
    const onTouchCancel = () => {
      touching = false;
    };
    const onTouchEnd = () => {
      touching = false;
    };
    const onKey = (e: KeyboardEvent) => {
      if (reduceMotion || e.defaultPrevented) return;
      const t = e.target as HTMLElement | null;
      if (t && (t.isContentEditable || /^(INPUT|TEXTAREA|SELECT)$/.test(t.tagName))) return;
      const down = e.key === "ArrowDown" || e.key === "PageDown" || e.key === " ";
      const up = e.key === "ArrowUp" || e.key === "PageUp";
      if (!down && !up) return;
      if (gliding) {
        e.preventDefault();
        return;
      }
      if (decide(down ? 1 : -1)) e.preventDefault();
    };

    const render = (time: number) => {
      if (disposed) return;
      frame = window.requestAnimationFrame(render);

      const rawMs = time - lastTime;
      const dt = Math.min(rawMs / 1000, 0.05);
      lastTime = time;

      const w = stage.clientWidth;
      const h = stage.clientHeight;
      if (w <= 0 || h <= 0 || !renderer) return;

      const sy = window.scrollY;
      if (Math.abs(sy - lastScrollY) > 0.5) lastMoveAt = time;
      scrollVel = (sy - lastScrollY) / Math.max(dt, 0.001);
      lastScrollY = sy;

      const rect = wrapper.getBoundingClientRect();
      const range = Math.max(wrapper.offsetHeight - window.innerHeight, 1);
      if (rect.bottom <= 0) return; /* stage fully scrolled away: nothing to draw */
      adaptDpr(rawMs, time);

      const p = clamp(-rect.top / range, 0, 1);

      /* settle a half-finished morph once the scroll has stopped */
      if (
        !gliding &&
        !dragging &&
        !touching &&
        !reduceMotion &&
        !coarsePointer &&
        time - lastMoveAt > SETTLE_IDLE_MS &&
        rect.top <= 2 &&
        p > TRANSITION_START + 0.01 &&
        p < SNAP_P - 0.004 &&
        document.documentElement.dataset.loader !== "playing"
      ) {
        glideTo(p > SETTLE_FORWARD_P ? SNAP_P : 0);
      }
      const K = smooth(TRANSITION_START, TRANSITION_END, p);
      if (p > SNAP_P + 0.012) lastBeyond = performance.now();
      exitP = smooth(SNAP_P + 0.02, 1, p);
      /* the featured section sits on the same #070707 as the canvas, so the wall just has to
         dissolve into the page colour: fade over the pinned tail (40%) + the first 60% of the
         stage scrolling out (60%), so nothing bright is left to be sliced by the stage's bottom edge */
      const leave = clamp(1 - rect.bottom / window.innerHeight, 0, 1);
      exitT = clamp(exitP * 0.4 + clamp(leave / 0.6, 0, 1) * 0.6, 0, 1);
      const m = clamp((p - TRANSITION_START) / (TRANSITION_END - TRANSITION_START), 0, 1);

      if (reduceMotion) {
        // Global spec constraint: disable auto spin and non-essential motion.
        // Keep a static, readable spiral pose; do not animate on scroll or time.
        spinProgress = 0;
        targetSpin = 0;
      } else {
        const scrollTarget = Math.min(p, SPIN_P_CAP) * SCROLL_SPIN;
        /* pauseOnHover / drag, same easing as React Bits */
        /* the stage is the whole viewport, so "mouse is over the stage" was always true and the
           spiral never auto-spun. only pause when the pointer is actually on a visible card */
        if (hasPointer && K < 0.01 && !dragging) {
          raycaster.setFromCamera(pointerNdc, camera);
          spiralHover = raycaster
            .intersectObjects(spiralMeshes, false)
            .some((hit) => {
              const m = hit.object as THREE.Mesh<THREE.PlaneGeometry, THREE.MeshBasicMaterial>;
              return m.visible && m.material.opacity > 0.25;
            });
        } else if (K >= 0.01) {
          spiralHover = false;
        }
        const desiredAuto = dragging || (PAUSE_ON_HOVER && spiralHover) ? 0 : AUTO_SPEED;
        spiralAuto += (desiredAuto - spiralAuto) * (1 - Math.exp(-dt * 7));
        targetSpin += dt * spiralAuto;
        const target = targetSpin + scrollTarget;
        spinProgress += (target - spinProgress) * (1 - Math.exp(-dt * (dragging ? 22 : 11)));
      }

      for (let i = 0; i < N; i++) {
        /* linear in scroll progress; the single smoothstep is applied per card in updateSpiral
           (before: eased glide -> smoothstep K -> smoothstep per card = slow, rush, stop) */
        morphKi[i] = clamp(m * (1 + MORPH_STAGGER) - (i / N) * MORPH_STAGGER, 0, 1);
      }

      const loaderPlaying = document.documentElement.dataset.loader === "playing";
      if (loaderPlaying || !assetsReady) {
        spiralIntro = 0;
        spiralIntroStart = -1;
      } else if (spiralIntro < 1) {
        if (spiralIntroStart < 0) spiralIntroStart = time;
        spiralIntro = smooth(0, 1600, time - spiralIntroStart);
      }
      if (mannequin) {
        const tt = time / 1000;
        const calm = 1 - smooth(0.02, 0.4, K);
        /* zero-gravity float + slow turn toward the pointer */
        const modelRise = Math.pow(1 - spiralIntro, 3) * -60; /* starts 60px low, eases up into place */
        mannequin.position.y = mannequinBaseY + Math.sin(tt * 0.8) * 7 * calm + modelRise;
        mannequin.rotation.y = Math.sin(tt * 0.35) * 0.25 + pointerDamped.x * 0.05;
        mannequin.rotation.z = Math.sin(tt * 0.5) * 0.03;

        /* delta is applied in each bone's local space on top of its rest rotation */
        const pose = (key: string, x: number, y: number, z: number) => {
          const b = bones[key];
          if (!b) return;
          poseEuler.set(x, y, z);
          b.bone.quaternion.copy(b.rest).multiply(poseQuat.setFromEuler(poseEuler));
        };
        const breath = Math.sin(tt * 1.3);
        pose("torso04", breath * 0.015, Math.sin(tt * 0.5) * 0.08, Math.sin(tt * 0.7) * 0.03);
        pose("chest05", breath * 0.02, Math.sin(tt * 0.5 + 0.6) * 0.06, 0);
        pose("neck06", 0, Math.sin(tt * 0.6 + 1) * 0.2, Math.sin(tt * 0.45) * 0.04);
        pose("head07", Math.sin(tt * 0.9) * 0.04, Math.sin(tt * 0.6 + 1.4) * 0.25, 0);
        /* arms hang down from the T-pose. if they go UP instead, flip ARM_DROP's sign */
        const ARM_DROP = 1.05;
        pose("armr08", 0, 0, ARM_DROP + Math.sin(tt * 0.9) * 0.06);
        pose("arml011", 0, 0, -ARM_DROP - Math.sin(tt * 0.9 + 0.4) * 0.06);
        pose("forearmr09", 0, 0, 0.25 + Math.sin(tt * 1.1) * 0.08);
        pose("forearml012", 0, 0, -0.25 - Math.sin(tt * 1.1 + 0.5) * 0.08);
        pose("thighl01", Math.sin(tt * 0.7) * 0.06, 0, 0.04);
        pose("thighr014", Math.sin(tt * 0.7 + Math.PI) * 0.06, 0, -0.04);
      }
      if (mannequin) {
        const mIntro = (1 - Math.pow(1 - spiralIntro, 3)) * (1 - smooth(0.02, 0.4, K));
        mannequin.visible = mIntro > 0.001;
        mannequin.traverse((child) => {
          const mesh = child as THREE.Mesh;
          if (mesh.isMesh) {
            const mat = mesh.material as THREE.Material | THREE.Material[];
            const mats = Array.isArray(mat) ? mat : [mat];
            for (const m of mats) {
              if (!m) continue;
              m.transparent = true;
              m.opacity = mIntro;
            }
          }
        });
      }

      updateWall(p, K, dt, reduceMotion);
      /* the wall only needs fresh world matrices while it is visible / being targeted */
      if (K > 0 || morphLock) wallGroup.updateWorldMatrix(true, true);
      camera.updateMatrixWorld();

      if (K > 0 && !morphLock) {
        morphLock = Array.from({ length: N }, (_, i) => getWallTarget(i));
        lockSeen.fill(0);
      } else if (K <= 0.001 && morphLock) {
        morphLock = null;
      }

      keepLocksContinuous();
      updateSpiral(w, h, K, reduceMotion, spiralIntro);

      const heroTextOut = smooth(0.02, 0.45, K);
      const heroTextOpacity = 1 - heroTextOut;
      const heroTextScale = 1 - heroTextOut;
      const heroOpacity = 1 - smooth(0, 0.22, p);
      const reelsOpacity = smooth(0.66, 0.8, p) * (1 - smooth(0.05, 0.5, exitT));
      if (vignetteRef.current) {
        if (Math.abs(K - lastVigO) > 0.002) {
          vignetteRef.current.style.opacity = String(K);
          lastVigO = K;
        }
      }
      if (exitRef.current) {
        const exitY = Math.round(-exitT * EXIT_TRAVEL * h); /* whole px: compositor-only, no gradient repaint */
        if (exitY !== lastExitY) {
          exitRef.current.style.transform = `translate3d(0, ${exitY}px, 0)`;
          lastExitY = exitY;
        }
      }
      const cursor = K < 0.01 ? (dragging ? "grabbing" : "grab") : "default";
      if (cursor !== lastCursor) {
        stage.style.cursor = cursor;
        lastCursor = cursor;
      }
      if (heroOverlayRef.current) {
        if (Math.abs(heroTextOpacity - lastHeroO) > 0.002) {
          heroOverlayRef.current.style.opacity =
            heroTextOpacity >= 0.999 ? "" : String(heroTextOpacity);
          lastHeroO = heroTextOpacity;
        }
        if (Math.abs(heroTextScale - lastHeroS) > 0.002) {
          if (heroTextScale >= 0.999) {
            heroOverlayRef.current.style.transform = "";
            heroOverlayRef.current.style.transformOrigin = "";
          } else {
            heroOverlayRef.current.style.transform = `scale(${heroTextScale})`;
            heroOverlayRef.current.style.transformOrigin = "center center";
          }
          lastHeroS = heroTextScale;
        }
      }
      if (heroMetaRef.current && Math.abs(heroOpacity - lastMetaO) > 0.002) {
        heroMetaRef.current.style.opacity = String(heroOpacity);
        lastMetaO = heroOpacity;
      }
      if (Math.abs(reelsOpacity - lastReelsO) > 0.002) {
        if (reelsHeadingRef.current) reelsHeadingRef.current.style.opacity = String(reelsOpacity);
        if (reelsMetaRef.current) reelsMetaRef.current.style.opacity = String(reelsOpacity);
        const video = reelsVideoRef.current;
        if (video) {
          video.style.opacity = String(reelsOpacity);
          /* lifts away and shrinks slightly as the hero hands off to the featured section */
          video.style.transform = `translate3d(0, ${(-exitT * 70).toFixed(1)}px, 0) scale(${(1 - exitT * 0.08).toFixed(3)})`;
          video.style.pointerEvents = reelsOpacity > 0.6 ? "auto" : "none";
        }
        lastReelsO = reelsOpacity;
      }

      renderer.render(scene, camera);
    };

    resize();
    frame = window.requestAnimationFrame(render);
    window.addEventListener("wheel", onWheel, { passive: false, capture: true });
    window.addEventListener("touchstart", onTouchStart, { passive: true });
    window.addEventListener("touchend", onTouchEnd, { passive: true });
    window.addEventListener("touchcancel", onTouchCancel, { passive: true });
    window.addEventListener("keydown", onKey);
    window.addEventListener("resize", resize);
    window.addEventListener("pointermove", onPointerMove);
    stage.addEventListener("pointerleave", onPointerLeave);
    stage.addEventListener("pointerdown", onPointerDown);
    window.addEventListener("pointerup", onPointerUp);
    window.addEventListener("pointercancel", onPointerUp);
    stage.style.userSelect = "none";

    return () => {
      disposed = true;
      window.cancelAnimationFrame(frame);
      window.cancelAnimationFrame(glideFrame);
      window.removeEventListener("wheel", onWheel, { capture: true });
      window.removeEventListener("touchstart", onTouchStart);
      window.removeEventListener("touchend", onTouchEnd);
      window.removeEventListener("touchcancel", onTouchCancel);
      window.removeEventListener("keydown", onKey);
      window.removeEventListener("resize", resize);
      window.removeEventListener("pointermove", onPointerMove);
      stage.removeEventListener("pointerleave", onPointerLeave);
      stage.removeEventListener("pointerdown", onPointerDown);
      window.removeEventListener("pointerup", onPointerUp);
      window.removeEventListener("pointercancel", onPointerUp);
      motionQuery.removeEventListener("change", onMotionChange);
      geometry.dispose();
      for (const { mesh } of spiralCards) {
        mesh.material.dispose();
      }
      clearWall();
      for (const tex of new Set(textures)) tex.dispose();
      if (mannequin) {
        mannequin.traverse((child) => {
          const mesh = child as THREE.Mesh;
          if (mesh.isMesh) {
            mesh.geometry.dispose();
            const mat = mesh.material as THREE.Material | THREE.Material[];
            const mats = Array.isArray(mat) ? mat : [mat];
            for (const m of mats) m?.dispose?.();
          }
        });
      }
      scene.clear();
      renderer?.dispose();
      renderer = null;
    };
  }, [canvasRef, stageRef, wrapperRef, heroOverlayRef, heroMetaRef, reelsHeadingRef, reelsMetaRef, reelsVideoRef, vignetteRef, exitRef]);
}