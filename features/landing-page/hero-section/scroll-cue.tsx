export function ScrollCue() {
  return (
    <>
      <div data-intro-fade className="absolute bottom-16 left-1/2 z-10 flex -translate-x-1/2 flex-col items-center gap-3">
        <span className="animate-scroll-bounce text-[10px] uppercase tracking-[0.5em] opacity-40">
          Scroll
        </span>
        <div className="relative flex h-10 w-6 items-start justify-center rounded-full border border-foreground/40 pt-2">
          <div className="animate-scroll-wheel h-2 w-0.5 rounded-full bg-foreground/60" />
        </div>
        <svg viewBox="0 0 24 24" className="h-4 w-4 text-foreground" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
          <polyline points="4,8 12,16 20,8" className="animate-scroll-v" />
        </svg>
      </div>
    </>
  );
}
