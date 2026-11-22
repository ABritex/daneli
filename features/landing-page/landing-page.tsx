import { ScrollPill } from "@/components/site";
import { works } from "@/features/works";
import { AboutSection } from "./about";
import { ContactSection } from "./cta";
import { FeaturedWorks } from "./featured-works";
import { HeroSection } from "./hero-section";
import { ServicesSection } from "./services";

/**
 * Landing page: spiral hero → drift wall reels → featured works → about → services → contact.
 */
export function LandingPage() {
  return (
    <main className="relative text-foreground">
      <ScrollPill />
      <div data-intro-fade>
        <HeroSection />
        <FeaturedWorks works={works} />
        <AboutSection />
        <ServicesSection />
        <ContactSection />
      </div>
    </main>
  );
}