import type { ResumeEducation } from "@/lib/db-content";

type Props = { education: ResumeEducation };

export function EducationSection({ education }: Props) {
    return (
        <section className="mx-auto w-full max-w-7xl py-20 md:py-28">
            <div className="grid grid-cols-1 gap-10 border-t border-foreground/15 pt-10 md:grid-cols-12 md:gap-8">
                <div className="md:col-span-3">
                    <p className="font-screener text-[10px] uppercase tracking-[0.32em] text-foreground/45">03 — Education</p>
                </div>

                <div className="md:col-span-9">
                    <div className="grid grid-cols-1 gap-4 border-b border-foreground/10 pb-12 md:grid-cols-12 md:gap-8">
                        <div className="md:col-span-8">
                            <h3 className="font-monument text-[clamp(1.4rem,3vw,2.5rem)] font-extrabold uppercase leading-[0.95] tracking-[-0.01em] text-foreground">{education.degree}</h3>
                            <p className="mt-4 font-mono text-[11px] uppercase tracking-[0.2em] text-foreground/55">{education.school}</p>
                            <p className="mt-5 max-w-2xl text-sm leading-relaxed text-foreground/70 md:text-base">{education.description}</p>
                        </div>
                        <div className="md:col-span-4 md:text-right">
                            <span className="font-screener text-[10px] uppercase tracking-[0.28em] text-foreground/45">{education.period}</span>
                        </div>
                    </div>
                </div>
            </div>
        </section>
    );
}
