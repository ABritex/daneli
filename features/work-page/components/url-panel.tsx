import { FADE_ATTR } from "@/features/works";

// accepts "client.com", "https://www.client.com/path?x=1"; anything that is not http(s) is rejected
function parseOutputUrl(raw: string) {
    try {
        const u = new URL(/^https?:\/\//i.test(raw.trim()) ? raw.trim() : `https://${raw.trim()}`);
        if (u.protocol !== "http:" && u.protocol !== "https:") return null;
        const path = (u.pathname + u.search).replace(/\/$/, "");
        return { href: u.href, host: u.hostname.replace(/^www\./, ""), path, secure: u.protocol === "https:" };
    } catch {
        return null;
    }
}

// full-height, full-bleed white panel (same footprint and colour as the "next project" footer)
export function UrlPanel({ url, title, caption }: { url: string; title?: string; caption?: string }) {
    const parsed = parseOutputUrl(url);
    if (!parsed) return null;

    return (
        <section className="relative z-10 mt-3 flex h-[72dvh] w-full shrink-0 md:mt-0 md:h-full md:w-[min(88vw,760px)]">
            <a href={parsed.href} target="_blank" rel="noreferrer" {...{ [FADE_ATTR]: "" }} className="group relative flex h-full w-full flex-col overflow-hidden bg-[#e9e8e3] text-background">
                {/* browser-style top bar (pt-24 on desktop keeps it clear of the floating nav) */}
                <div className="flex items-center gap-4 border-b border-background/15 px-6 pb-4 pt-6 md:px-10 md:pt-10">
                    <div className="flex gap-1.5" aria-hidden="true">
                        <span className="size-2 rounded-full bg-background/25" />
                        <span className="size-2 rounded-full bg-background/25" />
                        <span className="size-2 rounded-full bg-background/25" />
                    </div>
                    <div className="min-w-0 flex-1 truncate rounded-full border border-background/15 px-4 py-1.5 text-center font-screener text-[10px] uppercase tracking-[0.2em] text-background/60">
                        {parsed.secure ? "● " : ""}
                        {parsed.host}
                        {parsed.path}
                    </div>
                </div>

                <div className="flex flex-1 flex-col justify-between p-6 pb-28 md:p-10 md:pb-28">
                    <p data-reveal data-i="0" className="font-screener text-[10px] uppercase tracking-[0.32em] text-[#ff5a4a]">
                        {title?.trim() || "Live / Output URL"}
                    </p>

                    <div data-reveal data-i="1">
                        <h2 className="display-heading break-all text-[clamp(1.8rem,4vw,3.4rem)] text-background/30 transition-colors duration-500 group-hover:text-background">{parsed.host}</h2>
                        {caption?.trim() ? <p className="mt-4 max-w-md text-sm leading-relaxed text-background/70">{caption.trim()}</p> : null}
                    </div>

                    <div data-reveal data-i="2" className="flex items-end justify-between">
                        <span className="max-w-[12rem] font-screener text-[10px] uppercase leading-relaxed tracking-[0.28em] text-background/60">
                            Launch
                            <br />
                            project
                        </span>
                        <span
                            aria-hidden="true"
                            className="flex size-16 items-center justify-center rounded-full border border-background/40 text-2xl transition-all duration-500 ease-[cubic-bezier(.22,1,.36,1)] group-hover:rotate-45 group-hover:bg-background group-hover:text-[#e9e8e3] md:size-20"
                        >
                            ↗
                        </span>
                    </div>
                </div>
            </a>
        </section>
    );
}

// compact version that sits under the video inside the white video panel
export function UrlBar({ url }: { url: string }) {
    const parsed = parseOutputUrl(url);
    if (!parsed) return null;

    return (
        <a
            href={parsed.href}
            target="_blank"
            rel="noreferrer"
            {...{ [FADE_ATTR]: "" }}
            className="group mt-5 flex w-0 min-w-full items-center justify-between gap-6 border-t border-background/20 pt-4 text-background"
        >
            <span className="min-w-0">
                <span className="block font-screener text-[10px] uppercase tracking-[0.32em] text-[#ff5a4a]">Live / Output URL</span>
                <span className="mt-1 block truncate text-xl font-extrabold tracking-[-0.02em] text-background/40 transition-colors duration-500 group-hover:text-background md:text-3xl">
                    {parsed.host}
                    {parsed.path}
                </span>
            </span>
            <span className="flex shrink-0 items-center gap-3 font-screener text-[10px] uppercase tracking-[0.28em]">
                <span className="hidden sm:inline">Launch project</span>
                <span
                    aria-hidden="true"
                    className="flex size-11 items-center justify-center rounded-full border border-background/40 text-lg transition-all duration-500 ease-[cubic-bezier(.22,1,.36,1)] group-hover:rotate-45 group-hover:bg-background group-hover:text-[#e9e8e3]"
                >
                    ↗
                </span>
            </span>
        </a>
    );
}
