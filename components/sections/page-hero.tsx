export function PageHero({ title, intro }: { title: string; intro: string }) {
  return (
    <section className="px-8 pt-32 pb-20 md:px-16 lg:px-24">
      <div className="mx-auto max-w-[1240px]">
        <div className="grid grid-cols-1 gap-8 md:grid-cols-12">
          <div className="md:col-span-7">
            <h1 className="text-[clamp(3rem,8vw,7.5rem)] font-medium leading-[0.95] tracking-tight">
              {title}
            </h1>
          </div>
          <div className="md:col-span-5 flex items-end">
            <p className="text-xs uppercase leading-relaxed tracking-[0.12em] max-w-[22rem]">
              {intro}
            </p>
          </div>
        </div>
      </div>
    </section>
  );
}
