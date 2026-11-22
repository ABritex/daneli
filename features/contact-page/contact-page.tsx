import { BackLink, PageHero, SectionRule } from "@/components/sections";
import { ContactForm } from "./contact-form";
import { ContactInfo } from "./contact-info";
import { SocialLinks } from "./social-links";

export function ContactPage() {
  return (
    <main className="bg-background text-foreground min-h-screen">
      <PageHero
        title="Contact"
        intro="Let's build something together. Reach out for projects, collaborations, or just to say hello."
      />

      <SectionRule />

      <ContactInfo />

      <SectionRule />

      <SocialLinks />

      <SectionRule />

      <ContactForm />

      <BackLink />
    </main>
  );
}
