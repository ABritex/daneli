"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import type Lenis from "lenis";
import { Nav } from "./nav";

const getLenis = () => (window as unknown as { __lenis?: Lenis }).__lenis;

export function SiteHeader() {
  const pathname = usePathname();
  const [hidden, setHidden] = useState(false);

  useEffect(() => {
    if (pathname === "/") return;
    const root = document.documentElement;
    if (root.dataset.loader === "playing") root.dataset.loader = "skip";
    root.dataset.loader = "skip";
    root.dataset.intro = "color";
    root.style.setProperty("--intro-hold", "0ms");
    root.style.setProperty("--intro-shift", "0ms");

    // nav items sometimes get stuck hidden on SPA nav, so just force them visible
    document.querySelectorAll<HTMLElement>(".nav-item").forEach((el) => {
      el.style.opacity = "1";
      el.style.animation = "none";
      el.style.transform = "none";
    });
  }, [pathname]);

  useEffect(() => {
    let cleanupLenis: (() => void) | undefined;

    const apply = (_y: number) => {
      // only hide if header is actually on top of the footer
      // skip footers from hidden Activity pages
      const footer = Array.from(document.querySelectorAll("footer")).find(
        (f) => f.getClientRects().length > 0,
      );
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
    // lenis shows up after mount, so just poll a bit
    const poll = window.setInterval(() => {
      attachLenis();
      if (cleanupLenis) window.clearInterval(poll);
    }, 100);
    const stopPoll = window.setTimeout(() => window.clearInterval(poll), 4000);

    apply(current());
    // recheck a few times after route change, scroll settles a bit late sometimes
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
    "fixed left-0 right-0 top-6 z-40 flex h-[76px] items-center px-6 transition-[transform,opacity] duration-500 ease-[cubic-bezier(.22,1,.36,1)] md:px-8";
  const stripBase =
    "fixed left-0 right-0 top-0 z-40 h-6 transition-[transform,opacity] duration-500 ease-[cubic-bezier(.22,1,.36,1)]";
  const hiddenClass = "-translate-y-[calc(100%+1.5rem)] opacity-0 pointer-events-none";

  return (
    <>
      <div
        aria-hidden="true"
        className={`${stripBase} ${hidden ? hiddenClass : "translate-y-0 opacity-100"}`}
      />
      <div
        className={`${barBase} ${hidden ? hiddenClass : "translate-y-0 opacity-100"}`}
      >
        <div className="relative flex h-full w-full items-center">
          <Link
            href="/"
            aria-label="Home"
            className="nav-item absolute left-0 md:left-[15px] inline-flex opacity-55 transition-opacity duration-200 hover:opacity-100"
            style={{ "--i": 0 } as React.CSSProperties}
          >
            <span
              aria-hidden="true"
              className="block h-8 aspect-[1385/1664] -translate-y-[4px] bg-foreground md:h-10"
              style={{
                maskImage: "url(/daneli-word/daneli-logo-d.svg)",
                WebkitMaskImage: "url(/daneli-word/daneli-logo-d.svg)",
                maskSize: "contain",
                WebkitMaskSize: "contain",
                maskRepeat: "no-repeat",
                WebkitMaskRepeat: "no-repeat",
                maskPosition: "center",
                WebkitMaskPosition: "center",
              }}
            />
          </Link>
          <Nav />
        </div>
      </div>
    </>
  );
}