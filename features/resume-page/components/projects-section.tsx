import type { ResumeProject } from "@/lib/db-content";

type Props = { projects: ResumeProject[] };

export function ProjectsSection({ projects }: Props) {
    if (projects.length === 0) return null;
    return (
        <section className="mx-auto w-full max-w-7xl py-20 md:py-28">
            <div className="grid grid-cols-1 gap-10 border-t border-foreground/15 pt-10 md:grid-cols-12 md:gap-8">
                <div className="md:col-span-3">
                    <p className="font-screener text-[10px] uppercase tracking-[0.32em] text-foreground/45">Projects</p>
                </div>
                <div className="space-y-12 md:col-span-9">
                    {projects.map((p, i) => (
                        <div key={`${p.title}-${i}`} className="border-b border-foreground/10 pb-10">
                            <h3 className="font-monument text-[clamp(1.2rem,2.4vw,2rem)] font-extrabold uppercase leading-[1] text-foreground">{p.title}</h3>
                            {p.role ? <p className="mt-2 font-mono text-[11px] uppercase tracking-[0.2em] text-foreground/55">{p.role}</p> : null}
                            {p.period ? <p className="mt-1 font-screener text-[10px] uppercase tracking-[0.28em] text-foreground/45">{p.period}</p> : null}
                            <p className="mt-4 max-w-2xl text-sm leading-relaxed text-foreground/70 md:text-base">{p.description}</p>
                            {p.tags.length > 0 ? (
                                <div className="mt-4 flex flex-wrap gap-2">
                                    {p.tags.map((t) => (
                                        <span key={t} className="border border-foreground/20 px-2 py-1 text-[10px] uppercase tracking-[0.14em] text-foreground/60">
                                            {t}
                                        </span>
                                    ))}
                                </div>
                            ) : null}
                            {p.link ? (
                                <a href={p.link} className="mt-3 inline-block text-sm underline underline-offset-4 text-foreground/70 hover:text-foreground" target="_blank" rel="noreferrer">
                                    View project
                                </a>
                            ) : null}
                        </div>
                    ))}
                </div>
            </div>
        </section>
    );
}
