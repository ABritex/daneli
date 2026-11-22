"use client";

import { useEffect, useRef } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { GridLine } from "../grid";

const NAV_ITEMS = [
  { label: "work", href: "/" },
  { label: "about", href: "/about" },
  { label: "resume", href: "/resume" },
  { label: "blog", href: "/blog" },
  { label: "contact", href: "/contact" },
];

/**
 * Pure CSS intro: `.nav-item` is hidden while the loader plays and fades in
 * with the colour shift (see globals.css). --i is the stagger index.
 */
const idx = (i: number) => ({ "--i": i }) as React.CSSProperties;

export function Nav() {
  return (
    <nav className="relative flex h-full w-full items-center justify-between py-0" aria-label="Primary">
      <Link
        href="/"
        aria-label="DanEli home"
        style={idx(0)}
        className="nav-item flex items-center leading-none"
      >
        <span
          aria-hidden="true"
          className="block h-10 w-auto shrink-0 bg-current"
          style={{
            aspectRatio: "1384.67 / 1664.43",
            maskImage: 'url("/daneli-word/daneli-logo-d.svg")',
            maskPosition: "center",
            maskRepeat: "no-repeat",
            maskSize: "contain",
            WebkitMaskImage: 'url("/daneli-word/daneli-logo-d.svg")',
            WebkitMaskPosition: "center",
            WebkitMaskRepeat: "no-repeat",
            WebkitMaskSize: "contain",
          }}
        />
      </Link>

      <div className="hidden items-center gap-6 md:flex">
        {NAV_ITEMS.map((item, i) => (
          <Link
            key={item.href}
            href={item.href}
            style={idx(i + 1)}
            className="nav-item flex items-center text-xs uppercase leading-none tracking-[0.2em] hover:opacity-70"
          >
            {item.label}
          </Link>
        ))}
      </div>

      <span style={idx(6)} className="nav-item flex items-center">
        <Link
          href="/contact"
          className="inline-flex items-center justify-center rounded-none border border-foreground bg-transparent px-4 py-2 text-xs uppercase leading-none tracking-[0.2em] transition-colors hover:bg-foreground hover:text-background"
        >
          contact me
        </Link>
      </span>
    </nav>
  );
}

export function NavFrameLines() {
  const pathname = usePathname();
  const leftRef = useRef<HTMLDivElement>(null);
  const rightRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const els = [leftRef.current, rightRef.current].filter(
      (el): el is HTMLDivElement => Boolean(el),
    );
    const apply = () => {
      const h = window.scrollY + window.innerHeight;
      for (const el of els) el.style.height = `${h}px`;
    };
    apply();
    window.addEventListener("scroll", apply, { passive: true });
    window.addEventListener("resize", apply);
    return () => {
      window.removeEventListener("scroll", apply);
      window.removeEventListener("resize", apply);
    };
  }, [pathname]);

  return (
    <>
      <div
        ref={leftRef}
        aria-hidden="true"
        data-frame-line
        className="line-y pointer-events-none absolute left-4 top-0 z-[10005] h-screen border-l border-foreground transition-[height] duration-700 ease-out md:left-6"
      />
      <div
        ref={rightRef}
        aria-hidden="true"
        data-frame-line
        className="line-y pointer-events-none absolute right-4 top-0 z-[10005] h-screen border-r border-foreground transition-[height] duration-700 ease-out md:right-6"
      />
      <GridLine data-frame-line className="fixed top-6 z-[10005]" />
      <GridLine
        data-frame-line
        className="fixed top-[100px] z-[10005]"
        delay="var(--intro-stagger)"
      />
    </>
  );
}

export default Nav;

