import type { ResumeExperience } from "@/lib/db-content";

type Props = { experiences: ResumeExperience[] };

export function ExperienceSection({ experiences }: Props) {
    if (experiences.length === 0) {
        return (
            <section className="mx-auto w-full max-w-7xl py-20 md:py-28">
                <div className="grid grid-cols-1 gap-10 border-t border-foreground/15 pt-10 md:grid-cols-12 md:gap-8">
                    <div className="md:col-span-3">
                        <p className="font-screener text-[10px] uppercase tracking-[0.32em] text-foreground/45">01 — Experience</p>
                    </div>
                    <div className="md:col-span-9">
                        <p className="text-sm text-foreground/50">No experience entries yet.</p>
                    </div>
                </div>
            </section>
        );
    }
    return (
        <section className="mx-auto w-full max-w-7xl py-20 md:py-28">
            <div className="grid grid-cols-1 gap-10 border-t border-foreground/15 pt-10 md:grid-cols-12 md:gap-8">
                <div className="md:col-span-3">
                    <p className="font-screener text-[10px] uppercase tracking-[0.32em] text-foreground/45">01 — Experience</p>
                </div>

                <div className="space-y-12 md:col-span-9">
                    {experiences.map((e, i) => (
                        <div key={`${e.role}-${e.company}-${i}`} className="grid grid-cols-1 gap-4 border-b border-foreground/10 pb-12 md:grid-cols-12 md:gap-8">
                            <div className="md:col-span-8">
                                <p className="font-screener text-[10px] uppercase tracking-[0.28em] text-foreground/35">0{i + 1}</p>
                                <h3 className="mt-3 font-monument text-[clamp(1.4rem,3vw,2.5rem)] font-extrabold uppercase leading-[0.95] tracking-[-0.01em] text-foreground">{e.role}</h3>
                                <p className="mt-4 font-mono text-[11px] uppercase tracking-[0.2em] text-foreground/55">{e.company}</p>
                                <p className="mt-5 max-w-2xl text-sm leading-relaxed text-foreground/70 md:text-base">{e.description}</p>
                            </div>
                            <div className="md:col-span-4 md:text-right">
                                <span className="font-screener text-[10px] uppercase tracking-[0.28em] text-foreground/45">{e.period}</span>
                            </div>
                        </div>
                    ))}
                </div>
            </div>
        </section>
    );
}
