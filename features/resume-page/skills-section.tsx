import { SKILLS } from "./resume-data";

export function SkillsSection() {
  return (
    <section className="px-8 py-20 md:px-16 lg:px-24">
      <div className="mx-auto max-w-[1240px]">
        <div className="grid grid-cols-1 gap-12 md:grid-cols-12">
          <div className="md:col-span-3">
            <span className="text-xs uppercase tracking-[0.3em] opacity-50">Skills</span>
          </div>
          <div className="md:col-span-9 grid grid-cols-2 gap-8 md:grid-cols-3">
            {SKILLS.map((s) => (
              <div key={s.cat} className="border-t border-foreground/30 pt-4">
                <h4 className="text-sm font-medium uppercase tracking-[0.2em] mb-3">{s.cat}</h4>
                <ul className="space-y-1">
                  {s.items.map((item) => (
                    <li key={item} className="text-sm text-foreground/70">{item}</li>
                  ))}
                </ul>
              </div>
            ))}
          </div>
        </div>
      </div>
    </section>
  );
}
