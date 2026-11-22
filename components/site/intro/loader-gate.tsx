"use client";

import { useEffect } from "react";
import { usePathname } from "next/navigation";

/**
 * The boot script sets `html[data-loader]="playing"` on every load so the home
 * loader animation can run. Non-home pages don't mount <Loader />, which would
 * leave the site stuck in the "playing" intro state (nav hidden, intro content
 * faded, grid/colors waiting). On those routes we immediately complete the intro.
 */
export function LoaderGate() {
  const pathname = usePathname();

  useEffect(() => {
    const root = document.documentElement;
    if (pathname === "/") return;
    if (root.dataset.loader !== "playing") return;

    root.dataset.loader = "skip";
    root.dataset.intro = "color";
    window.dispatchEvent(new Event("daneli-loader-done"));
  }, [pathname]);

  return null;
}
