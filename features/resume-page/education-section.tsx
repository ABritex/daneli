import { EDUCATION } from "./resume-data";

export function EducationSection() {
    return (
        <section className="mx-auto w-full max-w-7xl py-20 md:py-28">
            <div className="grid grid-cols-1 gap-10 border-t border-foreground/15 pt-8 md:grid-cols-12 md:gap-8">
                <div className="md:col-span-3">
                    <p className="font-screener text-[10px] uppercase tracking-[0.32em] text-foreground/45">Education</p>
                </div>

                <div className="md:col-span-9">
                    <div className="grid grid-cols-1 gap-3 border-b border-foreground/10 pb-10 md:grid-cols-12 md:gap-6">
                        <div className="md:col-span-8">
                            <h3 className="font-monument text-[clamp(1.2rem,2.4vw,2rem)] font-extrabold uppercase leading-[1] tracking-normal text-foreground">{EDUCATION.degree}</h3>
                            <p className="mt-3 font-mono text-[11px] uppercase tracking-[0.2em] text-foreground/55">{EDUCATION.school}</p>
                            <p className="mt-4 max-w-2xl text-sm leading-relaxed text-foreground/65 md:text-base">{EDUCATION.desc}</p>
                        </div>
                        <div className="md:col-span-4 md:text-right">
                            <span className="font-screener text-[10px] uppercase tracking-[0.28em] text-foreground/45">{EDUCATION.period}</span>
                        </div>
                    </div>
                </div>
            </div>
        </section>
    );
}
