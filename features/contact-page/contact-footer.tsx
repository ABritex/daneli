"use client";

import { useEffect, useState } from "react";

/* edit these three */
export const CONTACT_EMAIL = "hello@yourdomain.com";
const TIMEZONE = "Asia/Manila";
const TIMEZONE_LABEL = "PHT";

type LenisLike = { scrollTo: (target: number, opts?: { duration?: number }) => void };

function ArrowUp() {
  return (
    <svg viewBox="0 0 24 24" width="22" height="22" fill="none" stroke="currentColor" strokeWidth="1.5" aria-hidden="true">
      <path d="M12 20V4M5 11l7-7 7 7" strokeLinecap="square" />
    </svg>
  );
}

/** minimal mono footer: back-to-top, contact line, live time, credit */
export function ContactFooter() {
  const [time, setTime] = useState("");

  useEffect(() => {
    const fmt = new Intl.DateTimeFormat("en-GB", {
      hour: "2-digit",
      minute: "2-digit",
      hour12: false,
      timeZone: TIMEZONE,
    });
    const tick = () => setTime(fmt.format(new Date()));
    tick();
    const id = window.setInterval(tick, 15000);
    return () => window.clearInterval(id);
  }, []);

  const toTop = () => {
    const lenis = (window as unknown as { __lenis?: LenisLike }).__lenis;
    if (lenis) lenis.scrollTo(0, { duration: 1.8 });
    else window.scrollTo({ top: 0, behavior: "smooth" });
  };

  return (
    <footer
      data-footer
      className="relative z-10 border-t border-[var(--grid-line)] px-6 py-6 font-mono text-[11px] uppercase leading-[1.7] tracking-[0.12em] text-foreground/70 md:px-12"
    >
      <div className="grid grid-cols-2 items-start gap-x-6 gap-y-8 md:grid-cols-4">
        <div data-footer-item className="col-span-2 flex items-center gap-4 md:col-span-1">
          <button
            type="button"
            onClick={toTop}
            aria-label="Back to top"
            className="flex h-12 w-12 shrink-0 items-center justify-center border border-foreground/50 text-foreground transition-colors duration-300 hover:bg-foreground hover:text-background"
          >
            <ArrowUp />
          </button>
          <p>
            Planning something new?
            <br />
            Don&apos;t be shy, say hello.
          </p>
        </div>

        <div data-footer-item>
          <p className="text-foreground/45">Drop me a line</p>
          <a
            href={`mailto:${CONTACT_EMAIL}`}
            className="text-foreground transition-opacity hover:opacity-60"
          >
            {"{ "}
            {CONTACT_EMAIL}
            {" }"}
          </a>
        </div>

        <div data-footer-item>
          <p className="text-foreground/45">Local time</p>
          <p className="text-foreground">
            <span className="mr-2 inline-block h-1.5 w-1.5 translate-y-[-1px] rounded-full bg-foreground" />
            {time ? `${time} (${TIMEZONE_LABEL})` : "--:--"}
          </p>
        </div>

        <div data-footer-item className="col-span-2 md:col-span-1 md:text-right">
          <p>Designed &amp; built by</p>
          <p className="text-foreground">Daniel Eli © {new Date().getFullYear()}</p>
        </div>
      </div>
    </footer>
  );
}
