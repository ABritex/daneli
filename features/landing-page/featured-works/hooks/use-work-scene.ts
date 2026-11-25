"use client";

import { useEffect, useRef } from "react";
import { onLoaderReady } from "../lib/on-loader-ready";
import { useLazyVideos } from "./use-lazy-videos";
import { initWorkCanvas } from "./use-work-canvas";
import { initWorkScrollAnimations } from "./use-work-scroll-animations";

// drives the featured works webgl scene
export function useWorkScene() {
  const rootRef = useRef<HTMLElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);

  useLazyVideos(rootRef);

  useEffect(() => {
    const root = rootRef.current;
    const canvas = canvasRef.current;
    if (!root || !canvas) return;

    let teardown: (() => void) | undefined;

    const init = () => {
      const canvasState = initWorkCanvas(root, canvas);
      const cleanupScroll = initWorkScrollAnimations(root, canvasState.planes, canvasState.sectionBody);
      return () => {
        cleanupScroll();
        canvasState.cleanup();
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
