import { ScrollPill } from "@/components/site";
import { works } from "@/features/works";
import { AboutSection } from "./about";
import { ContactSection } from "./cta";
import { FeaturedWorks } from "./featured-works";
import { HeroSection } from "./hero-section";
import { SectionCorners } from "./section-corners";
import { ServicesSection } from "./services";

export function LandingPage() {
  return (
    <main className="relative text-foreground">
      <ScrollPill />
      <SectionCorners />
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