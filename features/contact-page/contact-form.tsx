export function ContactForm() {
  return (
    <section className="px-8 py-20 md:px-16 lg:px-24">
      <div className="mx-auto max-w-[1240px]">
        <div className="grid grid-cols-1 gap-12 md:grid-cols-12">
          <div className="md:col-span-3">
            <span className="text-xs uppercase tracking-[0.3em] opacity-50">Send a message</span>
          </div>
          <div className="md:col-span-9 max-w-2xl">
            <form className="space-y-6">
              <div className="grid grid-cols-1 gap-6 md:grid-cols-2">
                <div>
                  <label className="block text-xs uppercase tracking-[0.3em] opacity-50 mb-2">Name</label>
                  <input
                    type="text"
                    className="w-full border-b border-foreground/30 bg-transparent py-2 text-base focus:border-foreground focus:outline-none transition-colors"
                    placeholder="Your name"
                  />
                </div>
                <div>
                  <label className="block text-xs uppercase tracking-[0.3em] opacity-50 mb-2">Email</label>
                  <input
                    type="email"
                    className="w-full border-b border-foreground/30 bg-transparent py-2 text-base focus:border-foreground focus:outline-none transition-colors"
                    placeholder="your@email.com"
                  />
                </div>
              </div>
              <div>
                <label className="block text-xs uppercase tracking-[0.3em] opacity-50 mb-2">Message</label>
                <textarea
                  rows={4}
                  className="w-full border-b border-foreground/30 bg-transparent py-2 text-base focus:border-foreground focus:outline-none transition-colors resize-none"
                  placeholder="Tell us about your project"
                />
              </div>
              <button
                type="submit"
                className="inline-flex items-center gap-2 text-xs uppercase tracking-[0.5em] font-medium border border-foreground px-6 py-3 hover:bg-foreground hover:text-background transition-colors"
              >
                Send message →
              </button>
            </form>
          </div>
        </div>
      </div>
    </section>
  );
}
