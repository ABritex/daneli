export function BioSection() {
  return (
    <section className="px-8 py-20 md:px-16 lg:px-24">
      <div className="mx-auto max-w-[1240px]">
        <div className="grid grid-cols-1 gap-12 md:grid-cols-12">
          <div className="md:col-span-3">
            <span className="text-xs uppercase tracking-[0.3em] opacity-50">01 — Bio</span>
          </div>
          <div className="md:col-span-9">
            <p className="text-2xl font-medium leading-relaxed tracking-tight max-w-3xl">
              DanEli is a creative studio operating at the intersection of design,
              technology, and storytelling. We build immersive digital experiences for
              ambitious brands — from concept to launch, with obsessive attention to
              typography, motion, and spatial composition.
            </p>
            <p className="mt-6 text-base leading-relaxed text-foreground/80 max-w-2xl">
              Our work spans brand identity, web experiences, 3D interfaces, and
              interactive installations. Each project begins with research and ends
              with craft — no shortcuts, no templates, no compromises.
            </p>
          </div>
        </div>
      </div>
    </section>
  );
}
