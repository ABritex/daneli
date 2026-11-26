import type { RefObject } from "react";
import { useHeroCanvas } from "./use-hero-canvas";

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
    art: string[];
    artMobile: string[];
};

// Orchestrates hero scene hooks (parity with featured works' useWorkScene).
export function useHeroScene(refs: Refs) {
    useHeroCanvas(refs);
}
