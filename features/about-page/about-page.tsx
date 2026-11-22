import { BackLink, PageHero, SectionRule } from "@/components/sections";
import { BioSection } from "./bio-section";
import { PrinciplesSection } from "./principles-section";
import { StatsSection } from "./stats-section";

export function AboutPage() {
  return (
    <main className="bg-background text-foreground min-h-screen">
      <PageHero
        title="About"
        intro="A multidisciplinary designer and developer focused on immersive digital experiences, Swiss typography, and spatial interfaces."
      />

      <SectionRule />

      <BioSection />

      <SectionRule />

      <PrinciplesSection />

      <SectionRule />

      <StatsSection />

      <BackLink />
    </main>
  );
}
