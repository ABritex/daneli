"use client";

import { useCallback, useEffect, useState } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import type Lenis from "lenis";
import { Nav } from "./nav";

const getLenis = () => (window as unknown as { __lenis?: Lenis }).__lenis;

const MENU_LINKS = [
  { label: "Home", href: "/" },
  { label: "Work", href: "/#work" },
  { label: "About", href: "/#about" },
  { label: "Resume", href: "/resume" },
  { label: "Contact", href: "/contact" },
];

const SLIDE_MS = 650;
const idx = (i: number) => ({ "--i": i }) as React.CSSProperties;

export function SiteHeader() {
  const pathname = usePathname();
  const [hidden, setHidden] = useState(false);
  const [open, setOpen] = useState(false);
  const [prevPathname, setPrevPathname] = useState(pathname);
  if (pathname !== prevPathname) {
    setPrevPathname(pathname);
    if (open) setOpen(false);
  }

  /* ---------- intro skip on inner pages (unchanged) ---------- */
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

  /* ---------- hide the header over the footer (unchanged) ---------- */
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

  /* ---------- mobile menu ---------- */
  const close = useCallback(() => setOpen(false), []);



  // while open: page behind stops scrolling, Esc closes
  useEffect(() => {
    if (!open) return;
    getLenis()?.stop();
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") setOpen(false);
    };
    window.addEventListener("keydown", onKey);
    return () => {
      window.removeEventListener("keydown", onKey);
      if (document.documentElement.dataset.loader !== "playing") getLenis()?.start();
    };
  }, [open]);

  // going to a section of the home page: close first, then glide there through Lenis
  const onMenuLink = (e: React.MouseEvent, href: string) => {
    setOpen(false);
    if (pathname !== "/" || !href.startsWith("/#")) return;
    const target = document.querySelector(href.slice(1));
    const lenis = getLenis();
    if (!target || !lenis) return;
    e.preventDefault();
    window.setTimeout(() => lenis.scrollTo(target as HTMLElement, { duration: 1.6 }), 350);
  };

  const barBase =
    "fixed left-0 right-0 top-6 z-40 flex h-[76px] items-center px-6 transition-[transform,opacity] duration-500 ease-[cubic-bezier(.22,1,.36,1)] md:px-8";
  const stripBase =
    "fixed left-0 right-0 top-0 z-40 h-6 transition-[transform,opacity] duration-500 ease-[cubic-bezier(.22,1,.36,1)]";
  const hiddenClass = "-translate-y-[calc(100%+1.5rem)] opacity-0 pointer-events-none";

  const circleBtn =
    "inline-flex size-11 items-center justify-center rounded-full border border-foreground/[0.12] bg-foreground/[0.09] text-foreground backdrop-blur-xl transition-colors duration-200 hover:bg-foreground/[0.16]";

  return (
    <>
      <div
        aria-hidden="true"
        className={`${stripBase} ${hidden ? hiddenClass : "translate-y-0 opacity-100"}`}
      />
      <div className={`${barBase} ${hidden ? hiddenClass : "translate-y-0 opacity-100"}`}>
        <div className="relative flex h-full w-full items-center">
          {/* mobile: hamburger on the left */}
          <button
            type="button"
            aria-label="Open menu"
            aria-expanded={open}
            aria-controls="mobile-menu"
            onClick={() => setOpen(true)}
            style={idx(0)}
            className={`nav-item absolute left-0 top-1/2 -translate-y-1/2 md:hidden ${circleBtn}`}
          >
            <span aria-hidden="true" className="flex flex-col gap-[5px]">
              <span className="block h-px w-[18px] bg-current" />
              <span className="block h-px w-[18px] bg-current" />
            </span>
          </button>

          {/* logo: centred on mobile, left on desktop */}
          <Link
            href="/"
            aria-label="Home"
            className="nav-item absolute left-1/2 z-10 -translate-x-1/2 inline-flex opacity-55 transition-opacity duration-200 hover:opacity-100 md:left-[15px] md:translate-x-0"
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

          {/* desktop: the existing pill */}
          <div className="hidden h-full w-full md:block">
            <Nav />
          </div>

          {/* mobile: contact on the right */}
          <span
            style={idx(1)}
            className="nav-item absolute right-0 top-1/2 inline-flex -translate-y-1/2 md:hidden"
          >
            <Link
              href="/contact"
              className="rgb-btn relative inline-flex items-center justify-center rounded-[16px] bg-foreground px-5 py-2.5 text-sm font-medium leading-none text-background transition-colors duration-200 hover:bg-foreground/85"
            >
              Contact
            </Link>
          </span>
        </div>
      </div>

      {/* ---------- mobile menu: slides down from the top ---------- */}
      <div
        id="mobile-menu"
        role="dialog"
        aria-modal="true"
        aria-label="Menu"
        aria-hidden={!open}
        className={`fixed inset-0 z-50 overflow-y-auto overscroll-contain bg-[#1b1b1b] text-foreground md:hidden ${
          open ? "translate-y-0" : "-translate-y-full"
        }`}
        style={{
          transition: `translate ${SLIDE_MS}ms cubic-bezier(.7,0,.2,1), visibility 0s linear ${
            open ? "0ms" : `${SLIDE_MS}ms`
          }`,
          visibility: open ? "visible" : "hidden",
        }}
      >
        {/* back button: sits exactly where the hamburger is */}
        <button
          type="button"
          aria-label="Back"
          onClick={close}
          tabIndex={open ? 0 : -1}
          className="absolute left-6 top-10 inline-flex items-center gap-3"
        >
          <span className={circleBtn}>
            <svg
              viewBox="0 0 20 20"
              fill="none"
              stroke="currentColor"
              strokeWidth="1.4"
              strokeLinecap="round"
              strokeLinejoin="round"
              className="size-[18px]"
              aria-hidden="true"
            >
              <path d="M16 10H4M9 5l-5 5 5 5" />
            </svg>
          </span>
          <span className="font-mono text-[10px] uppercase tracking-[0.32em] text-foreground/55">
            Back
          </span>
        </button>

        <div className="flex min-h-full flex-col px-6 pb-[max(2rem,env(safe-area-inset-bottom))] pt-24">
          <ul className="mt-auto mb-10">
            {MENU_LINKS.map((l, i) => (
              <li key={l.href} className="overflow-hidden">
                <Link
                  href={l.href}
                  onClick={(e) => onMenuLink(e, l.href)}
                  tabIndex={open ? 0 : -1}
                  className="block py-[0.18em] text-[clamp(1.75rem,min(9.5vw,7vh),3rem)] font-medium leading-[1.1] tracking-[-0.03em] text-foreground"
                  style={{
                    transform: open ? "translateY(0)" : "translateY(110%)",
                    opacity: open ? 1 : 0,
                    transition: `transform 700ms cubic-bezier(.22,1,.36,1) ${
                      open ? 260 + i * 60 : 0
                    }ms, opacity 500ms ease ${open ? 260 + i * 60 : 0}ms`,
                  }}
                >
                  {l.label}
                </Link>
              </li>
            ))}
          </ul>

          <p
            className="font-mono text-[10px] uppercase leading-[1.8] tracking-[0.28em] text-foreground/40"
            style={{
              opacity: open ? 1 : 0,
              transition: `opacity 600ms ease ${open ? 650 : 0}ms`,
            }}
          >
            Designed &amp; built by
            <br />
            Daniel Eli © 2026
          </p>
        </div>
      </div>
    </>
  );
}