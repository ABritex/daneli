"use client";

import { useEffect, useRef } from "react";
import * as THREE from "three";
import { mergeVertices } from "three/examples/jsm/utils/BufferGeometryUtils.js";
import { gsap } from "gsap";
import { ScrollTrigger } from "gsap/ScrollTrigger";

gsap.registerPlugin(ScrollTrigger);

const SPHERES = [
  { radius: 4.4, speed: 0.2, phase: 0, tilt: [0.35, 0.18], r: 0.95, spin: [0.22, 0.31] },
  { radius: 4.4, speed: 0.2, phase: Math.PI, tilt: [0.35, 0.18], r: 0.75, spin: [-0.18, 0.26] },
  { radius: 6.0, speed: -0.13, phase: 1.1, tilt: [-0.3, -0.22], r: 1.15, spin: [0.16, -0.24] },
  { radius: 6.0, speed: -0.13, phase: 1.1 + Math.PI, tilt: [-0.3, -0.22], r: 0.85, spin: [0.27, -0.18] },
  { radius: 3.2, speed: 0.3, phase: 2.2, tilt: [0.6, -0.1], r: 0.55, spin: [-0.3, 0.2] },
  { radius: 3.2, speed: 0.3, phase: 2.2 + Math.PI, tilt: [0.6, -0.1], r: 0.65, spin: [0.2, 0.28] },
] as const;

function createRockGeometry() {
  let geo: THREE.BufferGeometry = new THREE.IcosahedronGeometry(1, 5);
  geo.deleteAttribute("normal");
  geo.deleteAttribute("uv");
  geo = mergeVertices(geo, 1e-4);

  const pos = geo.attributes.position as THREE.BufferAttribute;
  const v = new THREE.Vector3();
  for (let i = 0; i < pos.count; i++) {
    v.fromBufferAttribute(pos, i).normalize();
    const n =
      Math.sin(v.x * 2.3 + 1.3) * Math.sin(v.y * 2.1 + 0.7) * Math.sin(v.z * 2.6 + 2.1) * 0.16 +
      Math.sin(v.x * 5.1 + v.y * 4.3) * Math.cos(v.z * 4.7) * 0.05;
    v.multiplyScalar(1 + n);
    pos.setXYZ(i, v.x, v.y, v.z);
  }
  geo.computeVertexNormals();
  return geo;
}

export function ContactScene() {
  const canvasRef = useRef<HTMLCanvasElement>(null);

  useEffect(() => {
    const canvas = canvasRef.current;
    const host = canvas?.parentElement;
    if (!canvas || !host) return;

    let renderer: THREE.WebGLRenderer;
    try {
      renderer = new THREE.WebGLRenderer({ canvas, alpha: true, antialias: true });
    } catch {
      return;
    }

    renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
    renderer.setClearColor(0x000000, 0);

    const scene = new THREE.Scene();
    const camera = new THREE.PerspectiveCamera(35, 1, 0.1, 100);
    camera.position.set(0, 0, 14);

    scene.add(new THREE.AmbientLight(0xffffff, 0.45));
    const key = new THREE.DirectionalLight(0xffffff, 2.6);
    key.position.set(-5, 6, 7);
    scene.add(key);
    const rim = new THREE.DirectionalLight(0x9fb4ff, 0.9);
    rim.position.set(6, -2, -5);
    scene.add(rim);

    const geometry = createRockGeometry();
    const material = new THREE.MeshStandardMaterial({
      color: 0x4a4744,
      roughness: 0.92,
      metalness: 0.04,
    });

    const world = new THREE.Group();
    scene.add(world);

    const items = SPHERES.map((s, i) => {
      const holder = new THREE.Group();
      const mesh = new THREE.Mesh(geometry, material);
      mesh.scale.setScalar(s.r);
      mesh.rotation.set(i * 1.7, i * 2.3, i * 0.9);
      holder.add(mesh);
      world.add(holder);
      return { holder, mesh, s, i, tilt: new THREE.Euler(s.tilt[0], 0, s.tilt[1]) };
    });

    let spread = 1;
    const resize = () => {
      const w = host.clientWidth;
      const h = host.clientHeight;
      if (w <= 0 || h <= 0) return;
      renderer.setSize(w, h, false);
      camera.aspect = w / h;
      camera.updateProjectionMatrix();
      spread = Math.min(1, Math.max(0.36, camera.aspect / 1.8));
    };

    resize();
    const ro = new ResizeObserver(resize);
    ro.observe(host);

    const pointer = { x: 0, y: 0 };
    const smooth = { x: 0, y: 0 };
    const onMove = (e: PointerEvent) => {
      pointer.x = e.clientX / window.innerWidth - 0.5;
      pointer.y = e.clientY / window.innerHeight - 0.5;
    };
    window.addEventListener("pointermove", onMove);

    const section = host.closest("section") ?? host;
    const grow = gsap.fromTo(
      items.map((it) => it.holder.scale),
      { x: 0.5, y: 0.5, z: 0.5 },
      {
        x: 1,
        y: 1,
        z: 1,
        ease: "power2.out",
        stagger: 0.08,
        scrollTrigger: { trigger: section, start: "top 85%", end: "top 15%", scrub: 1 },
      },
    );
    const fade = gsap.fromTo(
      canvas,
      { opacity: 0 },
      {
        opacity: 1,
        ease: "none",
        scrollTrigger: { trigger: section, start: "top 90%", end: "top 40%", scrub: 1 },
      },
    );

    let visible = false;
    const io = new IntersectionObserver(([entry]) => {
      visible = entry.isIntersecting;
    });
    io.observe(host);

    const v = new THREE.Vector3();
    let frame = 0;
    let last = performance.now();
    let time = 0;

    const render = (now: number) => {
      frame = requestAnimationFrame(render);
      const dt = Math.min((now - last) / 1000, 0.05);
      last = now;
      if (!visible) return;
      time += dt;

      const k = 1 - Math.exp(-dt * 3);
      smooth.x += (pointer.x - smooth.x) * k;
      smooth.y += (pointer.y - smooth.y) * k;
      world.rotation.y = smooth.x * 0.3;
      world.rotation.x = smooth.y * 0.2;

      for (const it of items) {
        const { s } = it;
        const a = s.phase + time * s.speed;
        v.set(Math.cos(a) * s.radius * spread, 0, Math.sin(a) * s.radius * 0.6);
        v.applyEuler(it.tilt);
        v.y += Math.sin(time * 0.7 + it.i * 1.3) * 0.12;
        it.holder.position.copy(v);

        it.mesh.rotation.x += dt * s.spin[0];
        it.mesh.rotation.y += dt * s.spin[1];
      }

      renderer.render(scene, camera);
    };

    frame = requestAnimationFrame(render);

    return () => {
      cancelAnimationFrame(frame);
      window.removeEventListener("pointermove", onMove);
      ro.disconnect();
      io.disconnect();
      grow.scrollTrigger?.kill();
      grow.kill();
      fade.scrollTrigger?.kill();
      fade.kill();
      geometry.dispose();
      material.dispose();
      renderer.dispose();
    };
  }, []);

  return (
    <canvas
      ref={canvasRef}
      aria-hidden="true"
      className="pointer-events-none absolute inset-0 -z-10 h-full w-full"
    />
  );
}
