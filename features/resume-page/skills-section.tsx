import { SKILLS } from "./resume-data";

export function SkillsSection() {
    return (
        <section className="mx-auto w-full max-w-7xl py-20 md:py-28">
            <div className="grid grid-cols-1 gap-10 border-t border-foreground/15 pt-8 md:grid-cols-12 md:gap-8">
                <div className="md:col-span-3">
                    <p className="font-screener text-[10px] uppercase tracking-[0.32em] text-foreground/45">Skills</p>
                </div>

                <div className="grid grid-cols-1 gap-8 sm:grid-cols-2 md:col-span-9 md:grid-cols-3">
                    {SKILLS.map((s) => (
                        <div key={s.cat} className="border-t border-foreground/10 pt-4">
                            <h4 className="font-monument text-sm font-extrabold uppercase tracking-normal text-foreground">{s.cat}</h4>
                            <ul className="mt-4 space-y-2">
                                {s.items.map((item) => (
                                    <li key={item} className="text-sm leading-relaxed text-foreground/65">
                                        {item}
                                    </li>
                                ))}
                            </ul>
                        </div>
                    ))}
                </div>
            </div>
        </section>
    );
}
