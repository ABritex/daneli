"use client";

export function ServicesSection() {
  return (
    <section
      id="services"
      className="relative flex min-h-screen items-center justify-center px-6 md:px-12"
    >
      <div className="mx-auto w-full max-w-7xl text-center">
        <p className="font-mono text-[10px] uppercase tracking-[0.32em] text-foreground/45">
          05 / Services
        </p>
        <h2 className="mt-6 text-[clamp(4rem,14vw,12rem)] font-black leading-[0.9] tracking-[-0.055em] text-foreground">
          Services
        </h2>
      </div>
    </section>
  );
}