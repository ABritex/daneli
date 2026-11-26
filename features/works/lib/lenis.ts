type LenisLike = {
    stop(): void;
    start(): void;
    resize?(): void;
    scrollTo(t: number, o?: Record<string, unknown>): void;
};

export const lenis = () => (window as unknown as { __lenis?: LenisLike }).__lenis;

// Lenis owns the scroll position, so always go through it
export const setScroll = (y: number) => {
    const l = lenis();
    if (l) {
        l.resize?.();
        l.scrollTo(y, { immediate: true, force: true });
    } else {
        window.scrollTo({ top: y, behavior: "instant" as ScrollBehavior });
    }
};
