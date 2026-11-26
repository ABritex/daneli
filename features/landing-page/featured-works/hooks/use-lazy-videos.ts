import { useEffect, type RefObject } from "react";
import { MQ_DESKTOP_768, mediaMatches } from "@/lib/media";
import { onLoaderReady } from "../lib/on-loader-ready";

const RETRY_MS = 600;

const hasSrc = (v: HTMLVideoElement) => !!v.getAttribute("src");

function ensureSrc(v: HTMLVideoElement) {
    if (!hasSrc(v) && v.dataset.src) {
        v.crossOrigin = "anonymous";
        v.src = v.dataset.src;
        v.load();
    }
}

function tryPlay(v: HTMLVideoElement) {
    // React sets `muted` as a property, never as an attribute, and autoplay depends on it
    v.muted = true;
    v.defaultMuted = true;
    v.playsInline = true;
    if (!v.paused && !v.ended) return;
    v.play().catch(() => {}); // rejected here is retried by the interval below
}

function unload(v: HTMLVideoElement) {
    v.pause();
    v.removeAttribute("src");
    v.load(); // releases the decoder + buffers
}

// this hook is the ONLY thing that loads, plays, pauses and unloads the card videos.
// (the render loop no longer calls play(), so the two can't fight each other)
export function useLazyVideos(rootRef: RefObject<HTMLElement | null>, key?: string) {
    useEffect(() => {
        const root = rootRef.current;
        if (!root) return;

        const mobile = !mediaMatches(MQ_DESKTOP_768);
        const wanted = new Set<HTMLVideoElement>(); // videos that should be playing right now

        let playIO: IntersectionObserver | null = null;
        let unloadIO: IntersectionObserver | null = null;
        let timer = 0;

        const resume = () => {
            if (document.hidden) return;
            wanted.forEach((v) => {
                ensureSrc(v);
                tryPlay(v);
            });
        };

        const stop = onLoaderReady(() => {
            const videos = Array.from(root.querySelectorAll<HTMLVideoElement>("video"));

            // play while (nearly) visible. phones decode with far fewer hardware decoders, so no margin there
            playIO = new IntersectionObserver(
                (entries) => {
                    for (const entry of entries) {
                        const v = entry.target as HTMLVideoElement;
                        if (entry.isIntersecting) {
                            wanted.add(v);
                            ensureSrc(v);
                            tryPlay(v);
                        } else {
                            wanted.delete(v);
                            v.pause();
                        }
                    }
                },
                { rootMargin: mobile ? "0px" : "200px 0px", threshold: 0.01 },
            );

            // free the decoder + buffers once a card is well away from the viewport
            unloadIO = new IntersectionObserver(
                (entries) => {
                    for (const entry of entries) {
                        const v = entry.target as HTMLVideoElement;
                        if (!entry.isIntersecting && hasSrc(v)) {
                            wanted.delete(v);
                            unload(v);
                        }
                    }
                },
                { rootMargin: "120% 0px", threshold: 0 },
            );

            videos.forEach((v) => {
                playIO!.observe(v);
                unloadIO!.observe(v);
            });

            // recovery: a play() that got rejected, a tab that was backgrounded, a route transition,
            // back/forward cache... none of those fire an intersection event, so poll the wanted set
            timer = window.setInterval(() => {
                wanted.forEach((v) => {
                    if (v.paused && !v.ended) {
                        ensureSrc(v);
                        tryPlay(v);
                    }
                });
            }, RETRY_MS);
            document.addEventListener("visibilitychange", resume);
            window.addEventListener("pageshow", resume);
        });

        return () => {
            stop();
            window.clearInterval(timer);
            document.removeEventListener("visibilitychange", resume);
            window.removeEventListener("pageshow", resume);
            playIO?.disconnect();
            unloadIO?.disconnect();
            wanted.clear();
        };
    }, [rootRef, key]); // key: re-scan the <video>s when the works list changes
}
