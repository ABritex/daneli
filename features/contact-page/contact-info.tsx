import { CONTACT_INFO } from "./contact-data";

export function ContactInfo() {
  return (
    <section className="px-8 py-20 md:px-16 lg:px-24">
      <div className="mx-auto max-w-[1240px]">
        <div className="grid grid-cols-1 gap-12 md:grid-cols-12">
          <div className="md:col-span-3">
            <span className="text-xs uppercase tracking-[0.3em] opacity-50">Get in touch</span>
          </div>
          <div className="md:col-span-9 grid grid-cols-1 gap-8 md:grid-cols-2">
            {CONTACT_INFO.map((c) => (
              <div key={c.label} className="border-t border-foreground/30 pt-4">
                <span className="text-xs uppercase tracking-[0.3em] opacity-50 block mb-2">{c.label}</span>
                <a href={c.href} className="text-lg font-medium tracking-tight hover:opacity-70 transition-opacity">
                  {c.value}
                </a>
              </div>
            ))}
          </div>
        </div>
      </div>
    </section>
  );
}
