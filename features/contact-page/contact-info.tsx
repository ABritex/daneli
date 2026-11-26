import { CONTACT_INFO } from "./contact-data";

export function ContactInfo() {
    return (
        <section className="mx-auto w-full max-w-7xl py-20 md:py-28">
            <div className="grid grid-cols-1 gap-10 border-t border-foreground/15 pt-8 md:grid-cols-12 md:gap-8">
                <div className="md:col-span-3">
                    <p className="font-screener text-[10px] uppercase tracking-[0.32em] text-foreground/45">Details</p>
                </div>

                <div className="grid grid-cols-1 gap-8 sm:grid-cols-2 md:col-span-9">
                    {CONTACT_INFO.map((c) => (
                        <div key={c.label} className="border-t border-foreground/10 pt-4">
                            <p className="font-screener text-[10px] uppercase tracking-[0.28em] text-foreground/45">{c.label}</p>
                            <a href={c.href} className="mt-3 inline-block text-lg font-medium tracking-tight text-foreground transition-opacity hover:opacity-70 md:text-xl">
                                {c.value}
                            </a>
                        </div>
                    ))}
                </div>
            </div>
        </section>
    );
}
