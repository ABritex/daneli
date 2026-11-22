import { BackLink, PageHero, SectionRule } from "@/components/sections";
import { EducationSection } from "./education-section";
import { ExperienceSection } from "./experience-section";
import { SkillsSection } from "./skills-section";

export function ResumePage() {
  return (
    <main className="bg-background text-foreground min-h-screen">
      <PageHero
        title="Resume"
        intro="Experience, skills, and education — a chronological record of work and growth."
      />

      <SectionRule />

      <ExperienceSection />

      <SectionRule />

      <SkillsSection />

      <SectionRule />

      <EducationSection />

      <BackLink />
    </main>
  );
}
