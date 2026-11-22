import { EXPERIENCE } from "./resume-data";

export function ExperienceSection() {
  return (
    <section className="px-8 py-20 md:px-16 lg:px-24">
      <div className="mx-auto max-w-[1240px]">
        <div className="grid grid-cols-1 gap-12 md:grid-cols-12">
          <div className="md:col-span-3">
            <span className="text-xs uppercase tracking-[0.3em] opacity-50">Experience</span>
          </div>
          <div className="md:col-span-9 space-y-12">
            {EXPERIENCE.map((e) => (
              <div key={e.role + e.company} className="border-t border-foreground/30 pt-6">
                <div className="flex flex-col md:flex-row md:items-baseline md:justify-between gap-2 mb-2">
                  <h3 className="text-2xl font-medium tracking-tight">{e.role}</h3>
                  <span className="text-xs uppercase tracking-[0.3em] opacity-50">{e.period}</span>
                </div>
                <p className="text-sm font-medium mb-2">{e.company}</p>
                <p className="text-sm leading-relaxed text-foreground/70 max-w-2xl">{e.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </div>
    </section>
  );
}
