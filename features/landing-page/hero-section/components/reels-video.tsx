"use client";

import Image from "next/image";
import { useState, type RefObject } from "react";
import { REELS_VIDEO_PLACEHOLDER, REELS_VIDEO_URL } from "../config/config";

const getYouTubeId = (url: string): string | null => {
  const raw = url.trim();
  if (!raw) return null;
  try {
    const u = new URL(raw);
    const host = u.hostname.replace(/^www\./, "");
    let id: string | null = null;
    if (host === "youtu.be") id = u.pathname.slice(1).split("/")[0];
    else if (host.endsWith("youtube.com") || host.endsWith("youtube-nocookie.com")) {
      if (u.pathname === "/watch") id = u.searchParams.get("v");
      else {
        const m = u.pathname.match(/^\/(?:embed|shorts|live|v)\/([^/?]+)/);
        id = m ? m[1] : null;
      }
    }
    return id && /^[\w-]{6,}$/.test(id) ? id : null;
  } catch {
    return null;
  }
};

/* the frame is driven by use-hero-section: opacity follows the reels fade, pointer events are
   only on while the reels are showing so the frame never blocks dragging the spiral */
export function ReelsVideo({ frameRef }: { frameRef: RefObject<HTMLDivElement | null> }) {
  const [playing, setPlaying] = useState(false);
  const id = getYouTubeId(REELS_VIDEO_URL);

  return (
    <div className="pointer-events-none absolute inset-0 z-[6] flex items-center justify-center px-6">
      <div
        ref={frameRef}
        className="reels-frame relative aspect-video w-[min(72vw,960px)] overflow-hidden border border-foreground/20 bg-black"
        style={{ opacity: 0, pointerEvents: "none", willChange: "opacity, transform" }}
      >
        {!id ? (
          <div className="flex h-full w-full items-center justify-center px-6 text-center font-screener text-[10px] uppercase tracking-[0.32em] text-foreground/50">
            {REELS_VIDEO_PLACEHOLDER}
          </div>
        ) : playing ? (
          <iframe
            className="absolute inset-0 h-full w-full"
            src={`https://www.youtube-nocookie.com/embed/${id}?autoplay=1&rel=0&modestbranding=1&playsinline=1`}
            title="Selected reels video"
            allow="autoplay; encrypted-media; picture-in-picture; fullscreen"
            allowFullScreen
          />
        ) : (
          /* click-to-play facade: YouTube only loads when someone presses play, so it never
             competes with the WebGL scene for bandwidth or main-thread time */
          <button
            type="button"
            onClick={() => setPlaying(true)}
            aria-label="Play video"
            className="group absolute inset-0 h-full w-full cursor-pointer"
          >
            <Image
              src={`https://i.ytimg.com/vi/${id}/hqdefault.jpg`}
              alt=""
              fill
              sizes="(max-width: 768px) 72vw, 960px"
              className="object-cover opacity-80 transition-opacity duration-300 group-hover:opacity-100"
            />
            <span className="absolute left-1/2 top-1/2 flex h-16 w-16 -translate-x-1/2 -translate-y-1/2 items-center justify-center rounded-full border border-foreground/60 bg-black/40 backdrop-blur-sm transition-transform duration-300 group-hover:scale-110">
              <svg viewBox="0 0 24 24" className="ml-0.5 h-6 w-6 fill-foreground" aria-hidden="true">
                <path d="M8 5v14l11-7z" />
              </svg>
            </span>
          </button>
        )}
      </div>
    </div>
  );
}
