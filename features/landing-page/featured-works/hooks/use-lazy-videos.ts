import { useEffect, type RefObject } from "react";
import { onLoaderReady } from "../lib/on-loader-ready";

// lazy load/play videos when they come into view
export function useLazyVideos(rootRef: RefObject<HTMLElement | null>) {
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
        { rootMargin: "200px 0px", threshold: 0.01 },
      );
      root.querySelectorAll<HTMLVideoElement>("video").forEach((v) => io!.observe(v));
    });
    return () => {
      stop();
      io?.disconnect();
    };
  }, [rootRef]);
}
