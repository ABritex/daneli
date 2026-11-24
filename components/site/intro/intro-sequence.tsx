"use client";

import { useEffect } from "react";

// waits after loader, then flips the site into color mode
export function IntroSequence() {
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
