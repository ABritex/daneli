"use client";

import { useEffect, useMemo, useRef } from "react";
import { gsap, useGSAP } from "@/lib/gsap";
import { GalleryMedia } from "./components/gallery-media";
import { getWorkPoster, getWorkSlug, getWorkVideo, proxyWork, works as staticWorks, useWorkTransition, PAGE_BG, FADE_ATTR, type Work } from "@/features/works";
import { TagList } from "@/components/ui/tag-list";
import { SpiralLoader } from "./components/spiral-loader";
import { useOverscrollProgress } from "./hooks/use-overscroll-progress";
import { usePopOnScroll } from "./hooks/use-pop-on-scroll";
import { useRevealOnScroll } from "./hooks/use-reveal-on-scroll";
import { useSmoothHorizontalScroll } from "./hooks/use-smooth-horizontal-scroll";

export function WorkPage({ work: rawWork, allWorks: rawAllWorks }: { work?: Work; allWorks?: Work[] }) {
    const resolved = useMemo(() => (rawWork ? proxyWork(rawWork) : undefined), [rawWork]);
    const allWorks = useMemo(() => rawAllWorks?.map(proxyWork), [rawAllWorks]);

    const rootRef = useRef<HTMLElement>(null);
    const trackRef = useRef<HTMLDivElement>(null);
    const footRef = useRef<HTMLButtonElement>(null);
    const spiralRef = useRef<SVGPathElement>(null);
    const spiralSvgRef = useRef<SVGSVGElement>(null);
    const hintRef = useRef<HTMLSpanElement>(null);
    const { close, next: goNext } = useWorkTransition();

    const navWorks = allWorks && allWorks.length ? allWorks : staticWorks;
    const currentSlug = resolved ? getWorkSlug(resolved) : "";
    const idx = currentSlug ? navWorks.findIndex((w) => getWorkSlug(w) === currentSlug) : -1;
    let nextWork: Work | undefined;
    if (navWorks.length > 1) {
        const start = idx >= 0 ? (idx + 1) % navWorks.length : 0;
        for (let i = 0; i < navWorks.length; i++) {
            const candidate = navWorks[(start + i) % navWorks.length];
            if (getWorkSlug(candidate) !== currentSlug) {
                nextWork = candidate;
                break;
            }
        }
    }
    const hasNext = !!nextWork;

    const nextRef = useRef(nextWork);
    const goNextRef = useRef(goNext);
    const openNextRef = useRef<() => void>(() => {});

    const openNext = () => {
        const nw = nextRef.current;
        const foot = footRef.current;
        if (!nw?.href || !foot || !resolved) return;
        if (getWorkSlug(nw) === getWorkSlug(resolved)) return;
        goNextRef.current(nw.href, { slug: getWorkSlug(nw), poster: nw.media, video: getWorkVideo(nw) }, foot);
    };

    useEffect(() => {
        nextRef.current = hasNext ? nextWork : undefined;
        goNextRef.current = goNext;
        openNextRef.current = openNext;
    });

    useGSAP(
        () => {
            if (!resolved) return;
            gsap.fromTo(`[${FADE_ATTR}]`, { y: 36, opacity: 0 }, { y: 0, opacity: 1, duration: 0.9, ease: "power3.out", stagger: 0.07, delay: 0.3 });
        },
        { scope: rootRef, dependencies: [resolved] },
    );

    useEffect(() => {
        const onKey = (e: KeyboardEvent) => {
            if (e.key === "Escape") close();
        };
        window.addEventListener("keydown", onKey);
        return () => window.removeEventListener("keydown", onKey);
    }, [close]);

    useRevealOnScroll(trackRef, !!resolved);
    const pop = usePopOnScroll(trackRef, !!resolved);
    const overscroll = useOverscrollProgress({
        trackRef,
        spiralRef,
        spiralSvgRef,
        hintRef,
        enabled: hasNext,
        resetKey: resolved?.id,
        onNext: () => openNextRef.current(),
    });
    useSmoothHorizontalScroll({
        trackRef,
        enabled: !!resolved,
        hasNext,
        pop,
        overscroll,
    });

    if (!resolved) {
        return (
            <main className="min-h-screen p-8 text-foreground" style={{ background: PAGE_BG }}>
                <h1 className="font-monument text-4xl font-extrabold uppercase">Project not found</h1>
            </main>
        );
    }

    const roles = resolved.role
        .split(",")
        .map((r) => r.trim())
        .filter(Boolean);
    const nextWords = (nextWork?.name ?? "").split(" ");

    return (
        <main ref={rootRef} className="h-dvh overflow-hidden text-foreground" style={{ background: PAGE_BG }}>
            <div
                ref={trackRef}
                data-lenis-prevent
                className="flex h-full flex-col overflow-y-auto overflow-x-hidden overscroll-contain md:flex-row md:overflow-x-auto md:overflow-y-hidden [scrollbar-width:none] [&::-webkit-scrollbar]:hidden"
            >
                {/* intro panel */}
                <section className="flex w-full shrink-0 flex-col justify-center px-6 pb-12 pt-32 md:h-full md:w-[min(94vw,1000px)] md:px-12 md:py-0 lg:px-16">
                    <TagList
                        {...{ [FADE_ATTR]: "" }}
                        className="mb-6 flex flex-wrap items-center gap-2 font-screener text-[10px] uppercase tracking-[0.32em] text-foreground/55"
                        tags={resolved.tags}
                        separatorClassName="text-foreground/35"
                    />

                    <h1
                        {...{ [FADE_ATTR]: "" }}
                        className="work-detail-title display-heading max-w-full"
                        // sized so the longest word fits the intro panel; Monument is very wide
                        style={{ fontSize: "clamp(1.6rem, 4.6vw, 4.6rem)", overflowWrap: "break-word" }}
                    >
                        {resolved.name}
                    </h1>

                    <div className="mt-8 flex flex-col gap-8 md:mt-10 md:flex-row md:gap-14">
                        <p {...{ [FADE_ATTR]: "" }} className="max-w-[26rem] text-sm leading-relaxed text-foreground/65">
                            {resolved.description}
                        </p>

                        <div {...{ [FADE_ATTR]: "" }} className="min-w-[9rem] text-xs leading-[1.9]">
                            <p className="mb-2 font-screener text-[10px] uppercase tracking-[0.28em] text-[#ff5a4a]">Services</p>
                            <ul className="text-foreground/70">
                                {roles.map((r) => (
                                    <li key={r}>{r}</li>
                                ))}
                            </ul>
                            <p className="mb-1 mt-5 font-screener text-[10px] uppercase tracking-[0.28em] text-[#ff5a4a]">Client / Year</p>
                            <p className="text-foreground/70">
                                {resolved.client}, {resolved.year}
                            </p>
                        </div>
                    </div>

                    {resolved.url && (
                        <a
                            {...{ [FADE_ATTR]: "" }}
                            href={resolved.url}
                            target="_blank"
                            rel="noreferrer"
                            className="mt-10 inline-flex w-fit items-center gap-3 rounded-full bg-foreground px-5 py-3 font-screener text-[10px] uppercase tracking-[0.28em] text-background transition-opacity duration-300 hover:opacity-80"
                        >
                            <span aria-hidden="true" className="size-1.5 rounded-full bg-background" />
                            Launch project
                        </a>
                    )}
                </section>

                {/* main media panel */}
                <section className="flex shrink-0 items-center px-4 py-3 md:h-full md:px-6 md:py-0">
                    <div data-pop="" className="relative w-full will-change-transform">
                        <div
                            {...{ [FADE_ATTR]: "" }}
                            className="relative w-full md:w-[min(86vw,calc(62vh*1.6))] aspect-[16/10] overflow-hidden bg-[#111]"
                            style={{ borderRadius: 6, filter: "blur(var(--mb, 0px))" }}
                        >
                            <GalleryMedia
                                src={resolved.video || resolved.media || "/media-placeholder.svg"}
                                poster={getWorkPoster(resolved)}
                                alt={resolved.name}
                                autoPlay
                                className="absolute inset-0 h-full w-full object-cover"
                            />
                        </div>
                        {resolved.mediaCaption ? (
                            <p className="absolute left-0 top-full mt-2 font-screener text-[10px] uppercase tracking-[0.24em] text-foreground/60">{resolved.mediaCaption}</p>
                        ) : null}
                    </div>
                </section>

                {/* gallery panels */}
                {resolved.gallery.map((item, i) => (
                    <section key={`${item.url}-${i}`} className="flex shrink-0 items-center px-4 py-3 md:h-full md:px-6 md:py-0">
                        <div data-pop="" className="relative w-full will-change-transform">
                            <div
                                {...{ [FADE_ATTR]: "" }}
                                className="relative w-full md:w-[min(86vw,calc(62vh*1.6))] aspect-[16/10] overflow-hidden bg-[#111]"
                                style={{ borderRadius: 6, filter: "blur(var(--mb, 0px))" }}
                            >
                                <GalleryMedia src={item.url} alt={`${resolved.name} ${i + 1}`} autoPlay />
                            </div>
                            {item.caption ? <p className="absolute left-0 top-full mt-2 font-screener text-[10px] uppercase tracking-[0.24em] text-foreground/60">{item.caption}</p> : null}
                        </div>
                    </section>
                ))}

                {/* next work: the last panel, flush with the end of the track */}
                {hasNext && nextWork && (
                    <section className="relative z-10 mt-3 flex h-[72dvh] w-full shrink-0 md:mt-0 md:h-full md:w-[min(88vw,640px)]">
                        <button
                            ref={footRef}
                            type="button"
                            {...{ [FADE_ATTR]: "" }}
                            onClick={openNext}
                            className="group relative flex h-full w-full flex-col justify-between overflow-hidden bg-[#e9e8e3] p-6 text-left text-background md:p-10"
                        >
                            <div className="flex items-start justify-between font-screener text-[10px] uppercase tracking-[0.32em] text-background/55">
                                <span data-reveal data-i="0">
                                    Next project
                                </span>
                                <span data-reveal data-i="1">
                                    {String(((idx + 1) % navWorks.length) + 1).padStart(2, "0")} / {String(navWorks.length).padStart(2, "0")}
                                </span>
                            </div>

                            <div>
                                <TagList
                                    as="p"
                                    data-reveal=""
                                    data-i="1"
                                    className="mb-5 flex flex-wrap gap-2 font-screener text-[10px] uppercase tracking-[0.32em] text-background/45"
                                    tags={nextWork.tags}
                                    itemClassName=""
                                    separatorClassName="mr-2"
                                />
                                <h2 className="display-heading text-[clamp(1.8rem,4vw,3.4rem)] text-background/30 transition-colors duration-500 group-hover:text-background">
                                    {nextWords.map((w, i) => (
                                        <span key={i} data-reveal-word data-i={i} className="mr-[0.25em] inline-block overflow-hidden align-top">
                                            <span className="inline-block">{w}</span>
                                        </span>
                                    ))}
                                </h2>
                            </div>

                            <div className="flex items-end justify-between">
                                <span ref={hintRef} className="max-w-[12rem] font-screener text-[10px] uppercase leading-relaxed tracking-[0.28em] text-background/60" style={{ opacity: 0.5 }}>
                                    Keep scrolling
                                    <br />
                                    to continue
                                </span>
                                <SpiralLoader spiralRef={spiralRef} spiralSvgRef={spiralSvgRef} />
                            </div>
                        </button>
                    </section>
                )}
            </div>

            {/* floating back button */}
            <div className="pointer-events-none fixed inset-x-0 bottom-8 z-[80] flex justify-center">
                <button
                    type="button"
                    {...{ [FADE_ATTR]: "" }}
                    onClick={close}
                    className="pointer-events-auto inline-flex items-center gap-3 rounded-full border border-foreground/40 bg-background/80 px-6 py-3 font-screener text-[10px] uppercase tracking-[0.28em] text-foreground backdrop-blur-md transition-colors duration-300 hover:bg-foreground hover:text-background"
                >
                    <span aria-hidden="true">←</span>
                    Back
                </button>
            </div>
        </main>
    );
}

export default WorkPage;
