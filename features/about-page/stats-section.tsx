const STATS = [
  { value: "10+", label: "Projects" },
  { value: "5", label: "Years" },
  { value: "3", label: "Awards" },
  { value: "∞", label: "Ideas" },
];

export function StatsSection() {
  return (
    <section className="px-8 py-20 md:px-16 lg:px-24">
      <div className="mx-auto max-w-[1240px]">
        <div className="grid grid-cols-2 gap-8 md:grid-cols-4">
          {STATS.map((s) => (
            <div key={s.label} className="border-t border-foreground/30 pt-4">
              <span className="text-5xl font-medium tracking-tight">{s.value}</span>
              <p className="mt-2 text-xs uppercase tracking-[0.3em] opacity-50">{s.label}</p>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
