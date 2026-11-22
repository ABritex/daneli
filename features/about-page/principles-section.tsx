const PRINCIPLES = [
  { title: "Grid First", desc: "Every layout begins with a structural grid. Content finds its place within the system, never against it." },
  { title: "Type as Image", desc: "Typography is not decoration. It carries meaning, rhythm, and spatial weight across every surface." },
  { title: "Motion with Purpose", desc: "Animation serves navigation and comprehension. Every transition earns its place." },
  { title: "Reduce to Essentia", desc: "Remove until nothing remains but what must be there. Then remove one more thing." },
];

export function PrinciplesSection() {
  return (
    <section className="px-8 py-20 md:px-16 lg:px-24">
      <div className="mx-auto max-w-[1240px]">
        <div className="grid grid-cols-1 gap-12 md:grid-cols-12">
          <div className="md:col-span-3">
            <span className="text-xs uppercase tracking-[0.3em] opacity-50">02 — Principles</span>
          </div>
          <div className="md:col-span-9 grid grid-cols-1 gap-8 md:grid-cols-2">
            {PRINCIPLES.map((p) => (
              <div key={p.title} className="border-t border-foreground/30 pt-4">
                <h3 className="text-lg font-medium tracking-tight mb-2">{p.title}</h3>
                <p className="text-sm leading-relaxed text-foreground/70">{p.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </div>
    </section>
  );
}
