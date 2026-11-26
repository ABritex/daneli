"use client";

import { createContext, useCallback, useContext, useEffect, useLayoutEffect, useRef } from "react";
import { usePathname, useRouter } from "next/navigation";
import { gsap } from "gsap";
import { FADE_ATTR, PAGE_BG, REVEAL_EVENT, WORK_CARD_ATTR, WORK_MEDIA_ATTR, WORK_REVEALED_ATTR, WORK_TRANSITIONING_ATTR } from "./constants";
import { drawFrameLines, hideFrameLines } from "./lib/frame-lines";
import { lenis, setScroll } from "./lib/lenis";
import { cardZoom, clearCardTransitionState, fullRect, makeOverlay, nextFrames, primeCardVideo, rectSettled, videoReady, type Overlay } from "./lib/work-overlay";

// card <-> page morph. open grows card to fullscreen, close shrinks it back.

export { FADE_ATTR, PAGE_BG };

const PUSH_AT = 1; // seconds into the open timeline when the route is pushed

type NextInfo = { slug: string; poster: string; video: string };
type Ctx = {
    open: (href: string, card: HTMLElement, media: HTMLElement) => void;
    // work page -> next work page: the next work grows out of `from`
    next: (href: string, info: NextInfo, from: HTMLElement) => void;
    close: () => void;
};
const WorkTransitionContext = createContext<Ctx>({ open: () => {}, next: () => {}, close: () => {} });
export const useWorkTransition = () => useContext(WorkTransitionContext);

type Last = {
    slug: string;
    poster: string;
    video: string;
    scrollY: number;
    direct?: boolean; // the first work page was opened by url, so there is no home entry to go back to
    overlay?: Overlay;
    tl?: gsap.core.Timeline;
};

// stuff on home that fades out when a card opens
const HOME_FADE_OPEN = "#work [data-head], #work [data-meta], #work h3";
const HOME_FADE = `${HOME_FADE_OPEN}, #work canvas`;
const cardCanvas = () => document.querySelector<HTMLElement>("#work canvas");
const resetCanvasZoom = () => {
    const c = cardCanvas();
    if (c) gsap.set(c, { clearProps: "transform,transformOrigin" });
};
function playExpandTimeline(ov: Overlay, { borderRadius, tilt, navigate, zoom = 1 }: { borderRadius?: string | number; tilt?: boolean; navigate: () => void; zoom?: number }) {
    const tl = gsap.timeline({ defaults: { overwrite: "auto" } });
    tl.to(ov.el, { ...fullRect(), ...(borderRadius !== undefined ? { borderRadius } : {}), duration: 1, ease: "power4.inOut" }, 0).to(
        ov.layer,
        { scale: 1.12 * zoom, duration: 1, ease: "power4.inOut" },
        0,
    );
    if (tilt) {
        tl.to(
            ov.el,
            {
                keyframes: [
                    { rotation: -1.8, duration: 0.45, ease: "power2.out" },
                    { rotation: 0, duration: 0.55, ease: "power2.inOut" },
                ],
            },
            0,
        );
    }
    tl.to(
        ov.layer,
        {
            keyframes: [
                { filter: "blur(9px)", duration: 0.4, ease: "power2.in" },
                { filter: "blur(0px)", duration: 0.5, ease: "power2.out" },
            ],
        },
        0.15,
    )
        .to(ov.layer, { opacity: 0, duration: 0.55, ease: "power2.inOut" }, 0.7)
        .call(navigate, undefined, PUSH_AT);
    return tl;
}

// cleanup leftover transition stuff
const resetHomeState = () => {
    gsap.killTweensOf(HOME_FADE);
    gsap.set(HOME_FADE, { opacity: 1 });
    resetCanvasZoom();
    clearCardTransitionState();
};

export function WorkTransitionProvider({ children }: { children: React.ReactNode }) {
    const router = useRouter();
    const pathname = usePathname();
    const prev = useRef(pathname);
    const last = useRef<Last | null>(null);
    const busy = useRef(false);
    const safety = useRef<number | undefined>(undefined);

    const unlock = () => {
        window.clearTimeout(safety.current);
        busy.current = false;
        lenis()?.start();
    };
    const lock = () => {
        busy.current = true;
        lenis()?.stop();
        window.clearTimeout(safety.current);
        // never stay locked if something goes wrong (dev compiles can be slow, so be generous)
        safety.current = window.setTimeout(unlock, 6000);
    };

    useEffect(() => {
        unlock();
        return () => {
            unlock();
            last.current?.tl?.kill();
            last.current?.overlay?.el.remove();
        };
    }, []);

    // we restore scroll ourselves; the browser/Next must not fight us
    useEffect(() => {
        const old = history.scrollRestoration;
        history.scrollRestoration = "manual";
        return () => {
            history.scrollRestoration = old;
        };
    }, []);

    /* ------------------------- card -> page ------------------------- */
    const open = useCallback(
        (href: string, card: HTMLElement, media: HTMLElement) => {
            // ignore clicks mid-transition (the safety timer recovers a stuck state)
            if (busy.current) return;

            const slug = card.dataset.workCard ?? "";
            const poster = card.dataset.poster ?? "";

            lock();
            router.prefetch(href);
            // the site frame goes away first; it is re-drawn once the work page settles
            hideFrameLines();

            const srcVideo = card.querySelector<HTMLVideoElement>("video");
            const video = srcVideo?.currentSrc || card.dataset.video || "";
            const rect = media.getBoundingClientRect();
            const radius = getComputedStyle(media).borderRadius;

            // clear any stale transition state from a previous visit
            last.current?.tl?.kill();
            last.current?.overlay?.el.remove();
            last.current = null;

            // start on exactly the zoom the WebGL card is showing (more while hovered, and the click is a hover)
            const zoom = cardZoom(media, card.matches(":hover"));
            const ov = makeOverlay({ poster, video, time: srcVideo?.currentTime }, rect, radius, 1, zoom);
            card.setAttribute(WORK_TRANSITIONING_ATTR, "");
            media.style.visibility = "hidden";

            gsap.to(HOME_FADE_OPEN, { opacity: 0, duration: 0.45, ease: "power2.out", overwrite: true });

            const tl = playExpandTimeline(ov, {
                borderRadius: 0,
                tilt: true,
                zoom,
                navigate: () => router.push(href, { scroll: false }),
            });

            // the other cards (drawn on the shared canvas) zoom away from the clicked card
            const gl = cardCanvas();
            if (gl) {
                tl.to(
                    gl,
                    {
                        scale: 1.3,
                        transformOrigin: `${rect.left + rect.width / 2}px ${rect.top + rect.height / 2}px`,
                        duration: 1,
                        ease: "power4.inOut",
                    },
                    0,
                );
            }

            last.current = { slug, poster, video, scrollY: window.scrollY, overlay: ov, tl };
        },
        [router], // eslint-disable-line react-hooks/exhaustive-deps
    );

    /* ------------------------- page -> next page ------------------------- */
    const next = useCallback(
        (href: string, info: NextInfo, from: HTMLElement) => {
            if (busy.current) return;
            lock();
            router.prefetch(href);
            hideFrameLines();

            const rect = from.getBoundingClientRect();
            const prev = last.current;
            prev?.tl?.kill();
            prev?.overlay?.el.remove();

            const ov = makeOverlay({ poster: info.poster, video: info.video }, rect, "0px", 1, 1);
            const tl = playExpandTimeline(ov, {
                navigate: () => router.replace(href, { scroll: false }),
            });

            // from here on Back morphs into the card of the work we are on now, not the first one
            last.current = {
                slug: info.slug,
                poster: info.poster,
                video: info.video,
                scrollY: prev?.scrollY ?? 0,
                direct: prev ? prev.direct : true,
                overlay: ov,
                tl,
            };
        },
        [router], // eslint-disable-line react-hooks/exhaustive-deps
    );

    /* ------------------------- page -> card ------------------------- */
    const close = useCallback(() => {
        if (busy.current) return;
        lock();
        // hide the frame first, then re-draw it on the page we land on
        hideFrameLines();
        gsap.to(`[${FADE_ATTR}]`, {
            opacity: 0,
            y: -12,
            duration: 0.3,
            stagger: { each: 0.02 },
            ease: "power2.in",
            // stay locked: the home branch below unlocks when the card has landed
            onComplete: () => {
                if (last.current && !last.current.direct) router.back();
                else router.push("/");
            },
        });
    }, [router]); // eslint-disable-line react-hooks/exhaustive-deps

    // layout effect: runs before paint, so the new page never flashes at the wrong scroll
    useLayoutEffect(() => {
        const was = prev.current;
        prev.current = pathname;

        // direct visit / reload: no morph runs, so the CSS intro draws the lines in
        if (was === pathname) return;
        const l = last.current;

        /* ---- arrived on a slug page ---- */
        if (pathname.startsWith("/work/")) {
            setScroll(0);
            const ov = l?.overlay;
            resetCanvasZoom();
            if (!ov) {
                drawFrameLines();
                unlock();
                return;
            }

            const reveal = () => {
                // tell the page to start its entrance, and fade the (page-coloured) overlay away
                ov.el.setAttribute(WORK_REVEALED_ATTR, "");
                window.dispatchEvent(new Event(REVEAL_EVENT));
                gsap.to(ov.el, {
                    opacity: 0,
                    duration: 0.3,
                    ease: "power1.out",
                    onComplete: () => {
                        ov.el.remove();
                        if (l) {
                            l.overlay = undefined;
                            l.tl = undefined;
                        }
                        // the page has fully revealed: draw the site frame back in on top of it
                        drawFrameLines();
                        unlock();
                    },
                });
            };

            // the route can land before the open timeline has finished: wait for it, never cut it off
            const tl = l?.tl;
            if (tl && tl.progress() < 1) tl.eventCallback("onComplete", reveal);
            else reveal();
            return;
        }

        /* ---- back on home: page colour shrinks into the card ---- */
        if (pathname === "/" && was.startsWith("/work/") && l) {
            lock();
            // hide the site frame while the colour shrinks away; redraw once the card has landed
            hideFrameLines();
            l.overlay?.el.remove();
            const ov = makeOverlay(l, fullRect(), "0px", 0, 1.12);
            l.overlay = ov;

            (async () => {
                await Promise.race([document.fonts?.ready, new Promise((r) => setTimeout(r, 600))]);
                await nextFrames(2);
                setScroll(l.scrollY);

                let card: HTMLElement | null = null;
                let media: HTMLElement | null = null;
                // works come from the database, so on a fresh home mount the cards may take a moment to exist
                for (let i = 0; i < 360 && !(card && media); i++) {
                    card = document.querySelector<HTMLElement>(`[${WORK_CARD_ATTR}="${l.slug}"]`);
                    media = card?.querySelector<HTMLElement>(`[${WORK_MEDIA_ATTR}]`) ?? null;
                    if (!(card && media)) await nextFrames(1);
                }
                if (!card || !media) {
                    ov.el.remove();
                    l.overlay = undefined;
                    drawFrameLines();
                    unlock();
                    return;
                }
                const c = card;
                const m = media;
                // land on the zoom the WebGL card rests at, so the hand-off back to the real card does not pop
                const zoom = cardZoom(m, false);
                gsap.set(ov.layer, { scale: zoom * 1.12 });
                // the first card we opened may not be the one we land on (work -> next work), so clear
                // every card the open left hidden before hiding the target
                clearCardTransitionState();
                c.setAttribute(WORK_TRANSITIONING_ATTR, "");
                m.style.visibility = "hidden";

                // restore the home content that was faded out on open (fresh mount, so make sure)
                gsap.to(HOME_FADE, { opacity: 1, duration: 0.3, ease: "power2.out", overwrite: true });

                let rect = m.getBoundingClientRect();
                if (rect.bottom < 0 || rect.top > window.innerHeight) {
                    setScroll(window.scrollY + rect.top - (window.innerHeight - rect.height) / 2);
                    await nextFrames(1);
                    rect = m.getBoundingClientRect();
                }

                // start the card video loading now, not whenever the lazy observer gets to it
                primeCardVideo(m);

                const radius = getComputedStyle(m).borderRadius;

                // the target is LIVE: the freshly mounted scroll animations keep sliding the cards for a
                // moment, so a rect measured once is stale by the time the overlay lands (it lands where
                // the card WAS). read the card's rect every frame and stay glued to it until the hand-off.
                const start = fullRect();
                const place = (k: number) => {
                    const r = m.getBoundingClientRect();
                    gsap.set(ov.el, {
                        left: start.left + (r.left - start.left) * k,
                        top: start.top + (r.top - start.top) * k,
                        width: start.width + (r.width - start.width) * k,
                        height: start.height + (r.height - start.height) * k,
                    });
                };
                const stick = () => {
                    if (!ov.el.isConnected) return gsap.ticker.remove(stick);
                    place(1);
                };
                const prog = { k: 0 };

                const tl = gsap.timeline({
                    onComplete: async () => {
                        gsap.ticker.add(stick);
                        // hold until the card stopped moving, has a video frame AND the GL plane had time to draw it
                        await Promise.all([rectSettled(m, 2000), videoReady(m, 5000)]);
                        await nextFrames(2);
                        m.style.visibility = "";
                        c.removeAttribute(WORK_TRANSITIONING_ATTR);
                        gsap.to(ov.el, {
                            opacity: 0,
                            duration: 0.35,
                            delay: 0.12,
                            onComplete: () => {
                                gsap.ticker.remove(stick);
                                ov.el.remove();
                                l.overlay = undefined;
                                // the card has landed on the home page: draw the site frame back in
                                drawFrameLines();
                                unlock();
                            },
                        });
                    },
                });
                l.tl = tl;
                tl.to(prog, { k: 1, duration: 0.95, ease: "power4.inOut", onUpdate: () => place(prog.k) }, 0)
                    .to(ov.el, { borderRadius: radius, duration: 0.95, ease: "power4.inOut" }, 0)
                    .to(ov.layer, { opacity: 1, duration: 0.5, ease: "power2.out" }, 0.15)
                    .to(ov.layer, { scale: zoom, duration: 0.95, ease: "power4.inOut" }, 0);
            })();
            return;
        }

        // any other route change: drop any abandoned morph and never stay locked
        if (l) {
            l.tl?.kill();
            l.overlay?.el.remove();
            last.current = null;
        }
        resetHomeState();
        // GridReplay skips work routes, so replay the frame draw-in when leaving one
        if (was.startsWith("/work/")) drawFrameLines();
        unlock();
    }, [pathname]); // eslint-disable-line react-hooks/exhaustive-deps

    return <WorkTransitionContext.Provider value={{ open, next, close }}>{children}</WorkTransitionContext.Provider>;
}
