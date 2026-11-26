"use client";

import { useState } from "react";
import { getWorkPoster, getWorkSlug, isVideoSrc, type Work } from "@/features/works";
import { TextAnimate } from "@/components/effects";
import { TagList } from "@/components/ui/tag-list";

type WorkCardProps = {
    work: Work;
    onOpen: (event: React.MouseEvent, work: Work) => void;
};

export function WorkCard({ work, onOpen }: WorkCardProps) {
    const w = work;
    const [mediaFailed, setMediaFailed] = useState(false);
    const poster = getWorkPoster(w);
    const videoSrc = w.video || (w.media && isVideoSrc(w.media) ? w.media : "");
    return (
        <article
            data-work
            data-work-card={getWorkSlug(w)}
            data-poster={poster ?? ""}
            data-video={videoSrc}
            className="relative group cursor-pointer md:max-w-[30rem] lg:max-w-none"
            onClick={(e) => onOpen(e, w)}
        >
            <div data-media className="relative aspect-[3/2] w-full overflow-hidden rounded-[14px] bg-background">
                {/* src is attached lazily once the card is near the viewport */}
                {mediaFailed ? (
                    <div className="absolute inset-0 flex items-center justify-center bg-[#111] font-screener text-[10px] uppercase tracking-[0.28em] text-foreground/45">Media unavailable</div>
                ) : videoSrc ? (
                    <video
                        data-src={videoSrc}
                        poster={poster}
                        crossOrigin="anonymous"
                        muted
                        loop
                        playsInline
                        preload="none"
                        className="absolute inset-0 h-full w-full object-cover"
                        onError={(e) => {
                            const v = e.currentTarget;
                            if (v.crossOrigin) {
                                v.crossOrigin = null;
                                v.removeAttribute("crossorigin");
                                v.load();
                                v.play().catch(() => {});
                                return;
                            }
                            setMediaFailed(true);
                        }}
                    />
                ) : poster ? (
                    // eslint-disable-next-line @next/next/no-img-element -- poster-only card; canvas uses video elements
                    <img
                        src={poster}
                        alt=""
                        loading="lazy"
                        decoding="async"
                        className="absolute inset-0 h-full w-full object-cover"
                        onError={(e) => {
                            const img = e.currentTarget;
                            if (img.crossOrigin) {
                                img.crossOrigin = null;
                                img.removeAttribute("crossorigin");
                                img.src = poster;
                                return;
                            }
                            setMediaFailed(true);
                        }}
                    />
                ) : (
                    <div className="absolute inset-0 flex items-center justify-center bg-[#111] font-screener text-[10px] uppercase tracking-[0.28em] text-foreground/45">No media</div>
                )}
            </div>
            <TagList
                data-meta=""
                className="mt-4 flex flex-wrap items-start gap-x-2 gap-y-1 text-left text-[10px] font-bold uppercase tracking-[0.28em] sm:text-xs sm:tracking-[0.5em]"
                tags={w.tags}
                animated
            />
            <h3 className="mt-2 overflow-hidden py-1">
                {/* the link is only as wide as the title, so the arrow reacts to the
            title alone, never to the card or the empty space beside it */}
                <a href={w.href ?? "#"} className="group/title inline-flex w-fit items-center">
                    <span data-title className={`flex items-start text-2xl font-extrabold tracking-[-0.02em] text-foreground md:text-3xl`}>
                        <span
                            aria-hidden="true"
                            className="inline-block w-0 -translate-x-3 overflow-hidden whitespace-nowrap opacity-0 transition-[width,transform,opacity,margin] duration-500 ease-[cubic-bezier(.22,1,.36,1)] group-hover/title:mr-3 group-hover/title:w-[1em] group-hover/title:translate-x-0 group-hover/title:opacity-100 group-focus-visible/title:mr-3 group-focus-visible/title:w-[1em] group-focus-visible/title:translate-x-0 group-focus-visible/title:opacity-100"
                        >
                            →
                        </span>
                        <TextAnimate as="span">{w.name}</TextAnimate>
                    </span>
                </a>
            </h3>
        </article>
    );
}
