"use client";

import { useEffect } from "react";

/**
 * The intro sequencer.
 *
 * Waits --intro-hold after the loader finishes, then sets
 * html[data-intro="color"], which makes --background / --foreground
 * transition from black/white to the real palette.
 */
export function IntroSequence() {
  // sequencer: loader finished -> hold -> colour shift
  useEffect(() => {
    const root = document.documentElement;
    let timer: number | undefined;

    const check = () => {
      const state = root.dataset.loader;
      if ((state !== "done" && state !== "skip") || timer !== undefined) return;
      const hold = parseFloat(getComputedStyle(root).getPropertyValue("--intro-hold")) || 1100;
      timer = window.setTimeout(() => {
        root.dataset.intro = "color";
      }, hold);
    };

    check();
    const observer = new MutationObserver(check);
    observer.observe(root, { attributes: true, attributeFilter: ["data-loader"] });
    window.addEventListener("daneli-loader-done", check);
    return () => {
      observer.disconnect();
      window.removeEventListener("daneli-loader-done", check);
      if (timer !== undefined) window.clearTimeout(timer);
    };
  }, []);

  return null;
}
