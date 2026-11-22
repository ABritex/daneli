import { ScrollPill } from "@/components/site";
import { works } from "@/features/works";
import { FeaturedWorks } from "./featured-works";
import { HeroSection } from "./hero-section";

export function LandingPage() {
  return (
    <main className="relative text-foreground">
      <ScrollPill />
      <HeroSection />
      <div data-intro-fade>
        <FeaturedWorks works={works} />
      </div>
    </main>
  );
}
