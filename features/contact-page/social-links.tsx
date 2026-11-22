import { SOCIALS } from "./contact-data";

export function SocialLinks() {
  return (
    <section className="px-8 py-20 md:px-16 lg:px-24">
      <div className="mx-auto max-w-[1240px]">
        <div className="grid grid-cols-1 gap-12 md:grid-cols-12">
          <div className="md:col-span-3">
            <span className="text-xs uppercase tracking-[0.3em] opacity-50">Social</span>
          </div>
          <div className="md:col-span-9 flex flex-wrap gap-6">
            {SOCIALS.map((s) => (
              <a
                key={s}
                href="#"
                className="text-sm uppercase tracking-[0.2em] font-medium hover:opacity-70 transition-opacity border-b border-foreground/30 pb-1"
              >
                {s}
              </a>
            ))}
          </div>
        </div>
      </div>
    </section>
  );
}
