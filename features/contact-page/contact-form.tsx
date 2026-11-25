import { siteConfig } from "@/lib/site";

export function ContactForm() {
  return (
    <section className="mx-auto w-full max-w-7xl py-20 md:py-28">
      <div className="grid grid-cols-1 gap-10 border-t border-foreground/15 pt-8 md:grid-cols-12 md:gap-8">
        <div className="md:col-span-3">
          <p className="font-screener text-[10px] uppercase tracking-[0.32em] text-foreground/45">
            Send a message
          </p>
        </div>

        <div className="md:col-span-9 max-w-2xl">
          <form className="space-y-8" action="#">
            <div className="grid grid-cols-1 gap-8 md:grid-cols-2">
              <label className="block">
                <span className="font-screener text-[10px] uppercase tracking-[0.28em] text-foreground/45">
                  Name
                </span>
                <input
                  type="text"
                  className="mt-3 w-full border-b border-foreground/20 bg-transparent py-3 text-sm text-foreground outline-none transition-colors placeholder:text-foreground/30 focus:border-foreground/60"
                  placeholder="Lorem ipsum"
                />
              </label>

              <label className="block">
                <span className="font-screener text-[10px] uppercase tracking-[0.28em] text-foreground/45">
                  Email
                </span>
                <input
                  type="email"
                  className="mt-3 w-full border-b border-foreground/20 bg-transparent py-3 text-sm text-foreground outline-none transition-colors placeholder:text-foreground/30 focus:border-foreground/60"
                  placeholder={siteConfig.email}
                />
              </label>
            </div>

            <label className="block">
              <span className="font-screener text-[10px] uppercase tracking-[0.28em] text-foreground/45">
                Message
              </span>
              <textarea
                rows={5}
                className="mt-3 w-full resize-none border-b border-foreground/20 bg-transparent py-3 text-sm text-foreground outline-none transition-colors placeholder:text-foreground/30 focus:border-foreground/60"
                placeholder="Lorem ipsum dolor sit amet, consectetur adipiscing elit..."
              />
            </label>

            <button
              type="submit"
              className="inline-flex items-center justify-center rounded-[16px] border border-foreground/30 px-6 py-3 font-screener text-[10px] uppercase tracking-[0.28em] text-foreground transition-colors hover:bg-foreground hover:text-background"
            >
              Send message
            </button>
          </form>
        </div>
      </div>
    </section>
  );
}
