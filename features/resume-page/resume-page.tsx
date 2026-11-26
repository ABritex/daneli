import Link from "next/link";
import { EducationSection } from "./education-section";
import { ExperienceSection } from "./experience-section";
import { SkillsSection } from "./skills-section";

export function ResumePage() {
    return (
        <main className="min-h-screen bg-background px-6 pt-32 text-foreground md:px-12 md:pt-40">
            <div className="mx-auto w-full max-w-7xl">
                <p className="font-screener text-[10px] uppercase tracking-[0.32em] text-foreground/45">Resume</p>
                <h1 className="mt-5 font-monument text-[clamp(3rem,10vw,8rem)] font-extrabold uppercase leading-[0.92] tracking-normal text-foreground">Resume</h1>
                <p className="mt-8 max-w-2xl text-base leading-relaxed text-foreground/60 md:text-lg">
                    Lorem ipsum dolor sit amet, consectetur adipiscing elit. Sed do eiusmod tempor incididunt ut labore et dolore magna aliqua.
                </p>
            </div>

            <ExperienceSection />
            <SkillsSection />
            <EducationSection />

            <div className="mx-auto w-full max-w-7xl pb-20 pt-10">
                <Link href="/" className="font-screener text-[10px] uppercase tracking-[0.32em] text-foreground/55 transition-colors hover:text-foreground">
                    ← Back to home
                </Link>
            </div>
        </main>
    );
}
