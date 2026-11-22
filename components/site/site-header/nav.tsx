"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";

/** section links */
const NAV_LINKS = [
  { label: "Work", href: "/#work" },
  { label: "About", href: "/#about" },
];

/** outlined button (the "Sign In" slot) */
const SECONDARY = { label: "Resume", href: "/resume" };

/** filled button with the rainbow RGB glow (the "Join Waitlist" slot).
    now points at the contact section on the landing page */
const PRIMARY = { label: "Contact", href: "/#contact" };

/**
 * Pure CSS intro: `.nav-item` is hidden while the loader plays and fades in
 * with the colour shift (see globals.css). --i is the stagger index.
 */
const idx = (i: number) => ({ "--i": i }) as React.CSSProperties;

/* NB: --radius is 0 in this theme, so rounded-2xl & co. render square.
   explicit px radii (and rounded-full) are used on purpose. */
const buttonBase =
  "inline-flex items-center justify-center rounded-[16px] px-5 py-2.5 text-sm font-medium leading-none transition-colors duration-200";

export function Nav() {
  const pathname = usePathname();
  const isActive = (href: string) => {
    if (href.includes("#")) return false;
    return href === "/" ? pathname === "/" : pathname === href || pathname.startsWith(`${href}/`);
  };

  return (
    <nav className="relative flex h-full w-full items-center justify-center py-0" aria-label="Primary">
      <div
        style={idx(0)}
        className="nav-item flex items-center gap-1.5 rounded-[22px] border border-foreground/[0.06] bg-foreground/[0.09] p-2 backdrop-blur-xl md:gap-2"
      >
        <div className="hidden items-center gap-1 pl-3 pr-2 md:flex">
          {NAV_LINKS.map((item, i) => (
            <a
              key={item.href}
              href={item.href}
              style={idx(i + 1)}
              className="nav-item px-2.5 py-2 text-sm font-medium leading-none text-foreground/55 transition-colors duration-200 hover:text-foreground"
            >
              {item.label}
            </a>
          ))}
        </div>

        <Link
          href={SECONDARY.href}
          style={idx(3)}
          aria-current={isActive(SECONDARY.href) ? "page" : undefined}
          className={`nav-item ${buttonBase} border border-foreground/25 text-foreground hover:bg-foreground/10`}
        >
          {SECONDARY.label}
        </Link>

        {/* the intro fade lives on this wrapper, not the button, so the glow
            (z-index -1 on the button) always paints behind the button's fill */}
        <span style={idx(4)} className="nav-item inline-flex">
          <Link
            href={PRIMARY.href}
            aria-current={isActive(PRIMARY.href) ? "page" : undefined}
            className={`rgb-btn relative ${buttonBase} bg-foreground text-background hover:bg-foreground/85`}
          >
            {PRIMARY.label}
          </Link>
        </span>
      </div>
    </nav>
  );
}

export default Nav;