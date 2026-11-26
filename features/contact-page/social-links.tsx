import { SOCIALS } from "./contact-data";

export function SocialLinks() {
    return (
        <section className="mx-auto w-full max-w-7xl py-20 md:py-28">
            <div className="grid grid-cols-1 gap-10 border-t border-foreground/15 pt-8 md:grid-cols-12 md:gap-8">
                <div className="md:col-span-3">
                    <p className="font-screener text-[10px] uppercase tracking-[0.32em] text-foreground/45">Social</p>
                </div>

                <div className="flex flex-wrap gap-x-8 gap-y-4 md:col-span-9">
                    {SOCIALS.map((s) => (
                        <a key={s} href="#" className="font-mono text-[11px] uppercase tracking-[0.2em] text-foreground/65 transition-colors hover:text-foreground">
                            {s}
                        </a>
                    ))}
                </div>
            </div>
        </section>
    );
}
