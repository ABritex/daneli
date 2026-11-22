"use client";

/* eslint-disable react-hooks/immutability */

import { useRef, useMemo, useEffect, useState } from "react";
import { Canvas, useFrame, useThree } from "@react-three/fiber";
import * as THREE from "three";

// dispatched by work-transition.tsx: detail=true while a card is opening
const PAUSE_EVENT = "work:pause";

const vertexShader = `
  varying vec2 vUv;
  void main() {
    vUv = uv;
    gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0);
  }
`;

const fragmentShader = `
  uniform sampler2D uTexture;
  uniform vec2 uMouse;
  uniform float uHover;
  uniform float uStrength;
  uniform float uRadius;
  varying vec2 vUv;

  void main() {
    vec2 uv = vUv;
    float dist = distance(uv, uMouse);
    float bulge = smoothstep(uRadius, 0.0, dist) * uStrength * uHover;
    vec2 dir = normalize(uv - uMouse + 0.0001);
    uv += dir * bulge * 0.08;
    gl_FragColor = texture2D(uTexture, uv);
  }
`;

function CardPlane({
  mediaSrc,
  isVideo,
  play,
}: {
  mediaSrc: string;
  isVideo: boolean;
  play: boolean;
}) {
  const meshRef = useRef<THREE.Mesh>(null);
  const mouse = useRef(new THREE.Vector2(0.5, 0.5));
  const hover = useRef(0);
  const { viewport, gl } = useThree();

  const texture = useMemo(() => {
    if (isVideo) {
      const video = document.createElement("video");
      video.preload = "auto";
      video.src = mediaSrc;
      video.loop = true;
      video.muted = true;
      video.playsInline = true;
      video.autoplay = true;
      video.crossOrigin = "anonymous";
      // kept 1px + invisible inside the card (see effect below) so the transition can find it
      video.style.cssText =
        "position:absolute;left:0;top:0;width:1px;height:1px;opacity:0;pointer-events:none";
      const tex = new THREE.VideoTexture(video);
      tex.minFilter = THREE.LinearFilter;
      tex.magFilter = THREE.LinearFilter;
      return tex;
    }
    const tex = new THREE.TextureLoader().load(mediaSrc);
    tex.minFilter = THREE.LinearFilter;
    tex.magFilter = THREE.LinearFilter;
    return tex;
  }, [mediaSrc, isVideo]);

  const uniforms = useMemo(
    () => ({
      uTexture: { value: texture },
      uMouse: { value: new THREE.Vector2(0.5, 0.5) },
      uHover: { value: 0 },
      uStrength: { value: 1.1 },
      uRadius: { value: 0.95 },
    }),
    [texture],
  );

  useFrame(() => {
    uniforms.uMouse.value.lerp(mouse.current, 0.07);
    uniforms.uHover.value += (hover.current - uniforms.uHover.value) * 0.06;
  });

  // attach the video to the DOM: work-transition reads currentTime / readyState from it
  useEffect(() => {
    if (!isVideo || !(texture instanceof THREE.VideoTexture)) return;
    const video = texture.image as HTMLVideoElement;
    gl.domElement.parentElement?.appendChild(video);
    return () => {
      video.pause();
      video.removeAttribute("src");
      video.load();
      video.remove();
    };
  }, [texture, isVideo, gl]);

  // only decode while on screen and not covered by the opening transition
  useEffect(() => {
    if (!isVideo || !(texture instanceof THREE.VideoTexture)) return;
    const video = texture.image as HTMLVideoElement;
    if (play) video.play().catch(() => {});
    else video.pause();
  }, [play, texture, isVideo]);

  useEffect(() => () => texture.dispose(), [texture]);

  return (
    <mesh
      ref={meshRef}
      scale={[viewport.width, viewport.height, 1]}
      onPointerMove={(e) => {
        mouse.current.set(e.uv?.x ?? 0.5, e.uv?.y ?? 0.5);
      }}
      onPointerEnter={() => {
        hover.current = 1;
      }}
      onPointerLeave={() => {
        hover.current = 0;
        mouse.current.set(0.5, 0.5);
      }}
    >
      <planeGeometry args={[1, 1, 32, 32]} />
      <shaderMaterial vertexShader={vertexShader} fragmentShader={fragmentShader} uniforms={uniforms} />
    </mesh>
  );
}

export function WarpedCard({
  mediaSrc,
  isVideo = false,
  className = "",
}: {
  mediaSrc: string;
  isVideo?: boolean;
  className?: string;
}) {
  const wrapRef = useRef<HTMLDivElement>(null);
  const [visible, setVisible] = useState(false);
  const [paused, setPaused] = useState(false);

  useEffect(() => {
    const el = wrapRef.current;
    if (!el) return;
    const io = new IntersectionObserver(([entry]) => setVisible(entry.isIntersecting), {
      rootMargin: "200px",
    });
    io.observe(el);
    const onPause = (e: Event) => setPaused(Boolean((e as CustomEvent<boolean>).detail));
    window.addEventListener(PAUSE_EVENT, onPause);
    return () => {
      io.disconnect();
      window.removeEventListener(PAUSE_EVENT, onPause);
    };
  }, []);

  const live = visible && !paused;

  return (
    <div ref={wrapRef} className={`relative overflow-hidden bg-black ${className}`}>
      <Canvas
        frameloop={live ? "always" : "never"}
        dpr={[1, 1.5]}
        gl={{ antialias: true, alpha: true, powerPreference: "high-performance" }}
        camera={{ position: [0, 0, 1], fov: 50 }}
        style={{ width: "100%", height: "100%" }}
      >
        <CardPlane mediaSrc={mediaSrc} isVideo={isVideo} play={live} />
      </Canvas>
    </div>
  );
}
