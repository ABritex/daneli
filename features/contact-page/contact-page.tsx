import { ContactForm } from "./contact-form";
import { ContactInfo } from "./contact-info";
import { SocialLinks } from "./social-links";

export function ContactPage() {
  return (
    <main className="min-h-screen bg-background px-6 pt-32 text-foreground md:px-12 md:pt-40">
      <div className="mx-auto w-full max-w-7xl">
        <p className="font-screener text-[10px] uppercase tracking-[0.32em] text-foreground/45">
          Contact
        </p>
        <h1 className="mt-5 font-monument text-[clamp(3rem,10vw,8rem)] font-extrabold uppercase leading-[0.92] tracking-normal text-foreground">
          Let&apos;s Talk
        </h1>
        <p className="mt-8 max-w-2xl text-base leading-relaxed text-foreground/60 md:text-lg">
          Lorem ipsum dolor sit amet, consectetur adipiscing elit. Sed do eiusmod tempor incididunt ut
          labore et dolore magna aliqua.
        </p>
      </div>

      <ContactInfo />
      <SocialLinks />
      <ContactForm />

      <div className="mx-auto w-full max-w-7xl pb-20 pt-10">
        <a
          href="/"
          className="font-screener text-[10px] uppercase tracking-[0.32em] text-foreground/55 transition-colors hover:text-foreground"
        >
          ← Back to home
        </a>
      </div>
    </main>
  );
}
