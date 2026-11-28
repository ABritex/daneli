import type { ResumeActivity } from "@/lib/db-content";

type Props = { activities: ResumeActivity[] };

export function ActivitiesSection({ activities }: Props) {
    if (activities.length === 0) return null;
    return (
        <section className="mx-auto w-full max-w-7xl py-20 md:py-28">
            <div className="grid grid-cols-1 gap-10 border-t border-foreground/15 pt-10 md:grid-cols-12 md:gap-8">
                <div className="md:col-span-3">
                    <p className="font-screener text-[10px] uppercase tracking-[0.32em] text-foreground/45">Activities</p>
                </div>
                <div className="space-y-10 md:col-span-9">
                    {activities.map((a, i) => (
                        <div key={`${a.title}-${i}`} className="border-b border-foreground/10 pb-8">
                            <h3 className="font-monument text-[clamp(1.1rem,2vw,1.6rem)] font-extrabold uppercase leading-[1.05] text-foreground">{a.title}</h3>
                            {a.organization ? <p className="mt-2 font-mono text-[11px] uppercase tracking-[0.2em] text-foreground/55">{a.organization}</p> : null}
                            {a.period ? <p className="mt-1 font-screener text-[10px] uppercase tracking-[0.28em] text-foreground/45">{a.period}</p> : null}
                            <p className="mt-4 max-w-2xl text-sm leading-relaxed text-foreground/70 md:text-base">{a.description}</p>
                        </div>
                    ))}
                </div>
            </div>
        </section>
    );
}
