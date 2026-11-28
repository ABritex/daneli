import type { ResumeSkillGroup } from "@/lib/db-content";

type Props = { skills: ResumeSkillGroup[] };

export function SkillsSection({ skills }: Props) {
    if (skills.length === 0) {
        return (
            <section className="mx-auto w-full max-w-7xl py-20 md:py-28">
                <div className="grid grid-cols-1 gap-10 border-t border-foreground/15 pt-10 md:grid-cols-12 md:gap-8">
                    <div className="md:col-span-3">
                        <p className="font-screener text-[10px] uppercase tracking-[0.32em] text-foreground/45">02 — Skills</p>
                    </div>
                    <div className="md:col-span-9">
                        <p className="text-sm text-foreground/50">No skills added yet.</p>
                    </div>
                </div>
            </section>
        );
    }
    return (
        <section className="mx-auto w-full max-w-7xl py-20 md:py-28">
            <div className="grid grid-cols-1 gap-10 border-t border-foreground/15 pt-10 md:grid-cols-12 md:gap-8">
                <div className="md:col-span-3">
                    <p className="font-screener text-[10px] uppercase tracking-[0.32em] text-foreground/45">02 — Skills</p>
                </div>

                <div className="grid grid-cols-1 gap-10 sm:grid-cols-2 md:col-span-9 md:grid-cols-3">
                    {skills.map((s) => (
                        <div key={s.category} className="border-t border-foreground/10 pt-5">
                            <h4 className="font-monument text-sm font-extrabold uppercase tracking-[0.04em] text-foreground">{s.category}</h4>
                            <ul className="mt-5 flex flex-wrap gap-2">
                                {s.items.map((item) => (
                                    <li key={item} className="border border-foreground/20 px-3 py-1.5 text-[11px] uppercase tracking-[0.14em] text-foreground/70">
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
