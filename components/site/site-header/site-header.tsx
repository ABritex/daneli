"use client";

import { useEffect, useState } from "react";
import { usePathname } from "next/navigation";
import type Lenis from "lenis";
import { Nav, NavFrameLines } from "./nav";

type HeaderState = "solid" | "transparent";

const getLenis = () => (window as unknown as { __lenis?: Lenis }).__lenis;

/**
 * Fixed site chrome. Solid at the top of the page, transparent + blurred after
 * scrolling. Only disappears while it overlaps the footer.
 * Re-evaluated on every route change: the header lives in the layout, so it survives
 * navigation and would otherwise keep the previous page's state.
 */
export function SiteHeader() {
  const pathname = usePathname();
  const [mode, setMode] = useState<HeaderState>("solid");
  const [hidden, setHidden] = useState(false);

  useEffect(() => {
    let cleanupLenis: (() => void) | undefined;

    const apply = (y: number) => {
      const atTop = y <= 24;
      setMode(atTop ? "solid" : "transparent");

      // Only hide when the fixed header actually overlaps the footer.
      const footer = document.querySelector("footer");
      if (!footer) {
        setHidden(false);
        return;
      }
      const headerBottom = 100; // strip + nav bar (aligned to 100px ruler/grid line)
      const { top } = footer.getBoundingClientRect();
      setHidden(top < headerBottom);
    };

    const current = () => getLenis()?.scroll ?? window.scrollY;
    const onScroll = () => apply(window.scrollY);
    const attachLenis = () => {
      const lenis = getLenis();
      if (!lenis || cleanupLenis) return;
      const onLenis = ({ scroll }: { scroll: number }) => apply(scroll);
      lenis.on("scroll", onLenis);
      cleanupLenis = () => lenis.off("scroll", onLenis);
    };

    attachLenis();
    window.addEventListener("scroll", onScroll, { passive: true });
    // Lenis is created after mount in SmoothScroll; poll briefly to attach.
    const poll = window.setInterval(() => {
      attachLenis();
      if (cleanupLenis) window.clearInterval(poll);
    }, 100);
    const stopPoll = window.setTimeout(() => window.clearInterval(poll), 4000);

    apply(current());
    // After a route change the new page mounts, then Next / SmoothScroll reset the scroll a tick
    // later. Re-read the real position a few times so the header never keeps a stale state.
    const settle = [0, 120, 400, 900].map((ms) => window.setTimeout(() => apply(current()), ms));

    return () => {
      window.removeEventListener("scroll", onScroll);
      window.clearInterval(poll);
      window.clearTimeout(stopPoll);
      settle.forEach((t) => window.clearTimeout(t));
      cleanupLenis?.();
    };
  }, [pathname]);

  const barBase =
    "fixed left-0 right-0 top-6 z-40 flex h-[76px] items-center px-6 transition-[transform,background-color,border-color,backdrop-filter,opacity] duration-500 ease-[cubic-bezier(.22,1,.36,1)] md:px-8";
  const stripBase =
    "fixed left-0 right-0 top-0 z-40 h-6 transition-[transform,background-color,backdrop-filter,opacity] duration-500 ease-[cubic-bezier(.22,1,.36,1)]";
  const solid =
    "bg-background border-y border-b-foreground/15 border-t-transparent backdrop-blur-none";
  const transparent =
    "bg-background/45 border-y border-b-foreground/10 border-t-transparent backdrop-blur-xl";
  const hiddenClass = "-translate-y-[calc(100%+1.5rem)] opacity-0 pointer-events-none";

  return (
    <>
      <div
        aria-hidden="true"
        className={`${stripBase} ${
          mode === "solid" ? "bg-background backdrop-blur-none" : "bg-background/45 backdrop-blur-xl"
        } ${hidden ? hiddenClass : "translate-y-0 opacity-100"}`}
      />
      <div
        className={`${barBase} ${mode === "solid" ? solid : transparent} ${
          hidden ? hiddenClass : "translate-y-0 opacity-100"
        }`}
      >
        <div className="flex h-full w-full items-center">
          <Nav />
        </div>
      </div>
      <NavFrameLines />
    </>
  );
}
