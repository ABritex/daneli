import { EDUCATION } from "./resume-data";

export function EducationSection() {
  return (
    <section className="px-8 py-20 md:px-16 lg:px-24">
      <div className="mx-auto max-w-[1240px]">
        <div className="grid grid-cols-1 gap-12 md:grid-cols-12">
          <div className="md:col-span-3">
            <span className="text-xs uppercase tracking-[0.3em] opacity-50">Education</span>
          </div>
          <div className="md:col-span-9">
            <div className="border-t border-foreground/30 pt-6">
              <div className="flex flex-col md:flex-row md:items-baseline md:justify-between gap-2 mb-2">
                <h3 className="text-2xl font-medium tracking-tight">{EDUCATION.degree}</h3>
                <span className="text-xs uppercase tracking-[0.3em] opacity-50">{EDUCATION.period}</span>
              </div>
              <p className="text-sm font-medium mb-2">{EDUCATION.school}</p>
              <p className="text-sm leading-relaxed text-foreground/70 max-w-2xl">
                {EDUCATION.desc}
              </p>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
