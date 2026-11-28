import Image from "next/image";
import Link from "next/link";
import type { ResumeActivity, ResumeCertificate, ResumeEducation, ResumeExperience, ResumeProfile, ResumeProject, ResumeSkillGroup } from "@/lib/db-content";
import { ActivitiesSection } from "./components/activities-section";
import { CertificatesSection } from "./components/certificates-section";
import { EducationSection } from "./components/education-section";
import { ExperienceSection } from "./components/experience-section";
import { ProjectsSection } from "./components/projects-section";
import { ResumeDownloadButton } from "./components/resume-download-button";
import { SkillsSection } from "./components/skills-section";

type ResumePageProps = {
    resume: {
        experiences: ResumeExperience[];
        education: ResumeEducation | null;
        skills: ResumeSkillGroup[];
        certificates: ResumeCertificate[];
        projects: ResumeProject[];
        activities: ResumeActivity[];
        profile: ResumeProfile;
        intro: string;
        availability: string;
    };
};

export function ResumePage({ resume }: ResumePageProps) {
    const p = resume.profile;
    const hasProfileHeader = Boolean(p.name || p.photoUrl || p.phone || p.email || p.location || p.website || p.title);
    const displayName = p.name || "Resume";
    const subtitle = p.title || resume.intro;

    return (
        <main className="min-h-screen bg-background px-6 pt-32 text-foreground md:px-12 md:pt-40 print:pt-8 print:px-8">
            <div className="mx-auto w-full max-w-7xl">
                <div className="flex flex-col gap-10 border-b border-foreground/15 pb-16 md:flex-row md:items-start md:justify-between md:pb-20 print:pb-8">
                    <div className="max-w-4xl">
                        <p className="font-screener text-[10px] uppercase tracking-[0.32em] text-foreground/45 print:text-foreground/70">Resume / CV</p>
                        <h1 className="mt-6 font-monument text-[clamp(3.2rem,10vw,8rem)] font-extrabold uppercase leading-[0.88] tracking-[-0.02em] text-foreground print:text-[2.5rem]">
                            {displayName}
                        </h1>
                        {subtitle ? <p className="mt-6 max-w-2xl text-sm leading-relaxed text-foreground/65 md:text-base print:text-foreground/80">{subtitle}</p> : null}
                        {hasProfileHeader ? (
                            <div className="mt-6 space-y-1 text-sm text-foreground/70">
                                {p.phone ? <p>{p.phone}</p> : null}
                                {p.email ? <p>{p.email}</p> : null}
                                {p.location ? <p>{p.location}</p> : null}
                                {p.website ? (
                                    <p>
                                        <a href={p.website} className="underline underline-offset-4" target="_blank" rel="noreferrer">
                                            {p.website}
                                        </a>
                                    </p>
                                ) : null}
                            </div>
                        ) : null}
                        <p className="mt-6 font-screener text-[10px] uppercase tracking-[0.28em] text-foreground/40 print:text-foreground/60">{resume.availability}</p>
                    </div>
                    <div className="flex flex-col items-start gap-6 md:items-end md:pb-2">
                        {p.photoUrl ? (
                            <div className="relative h-40 w-40 overflow-hidden rounded-full border border-foreground/15 bg-foreground/5 print:h-32 print:w-32">
                                <Image src={p.photoUrl} alt={displayName} fill className="object-cover" sizes="160px" />
                            </div>
                        ) : null}
                        <div className="print:hidden">
                            <ResumeDownloadButton resume={resume} />
                        </div>
                    </div>
                </div>
                {p.about ? (
                    <section className="mt-10 max-w-3xl">
                        <p className="font-screener text-[10px] uppercase tracking-[0.32em] text-foreground/45">About</p>
                        <p className="mt-4 text-sm leading-relaxed text-foreground/75 md:text-base">{p.about}</p>
                    </section>
                ) : null}
            </div>

            <ExperienceSection experiences={resume.experiences} />
            {resume.projects.length > 0 ? <ProjectsSection projects={resume.projects} /> : null}
            <SkillsSection skills={resume.skills} />
            {resume.activities.length > 0 ? <ActivitiesSection activities={resume.activities} /> : null}
            {resume.certificates.length > 0 ? <CertificatesSection certificates={resume.certificates} /> : null}
            {resume.education ? <EducationSection education={resume.education} /> : null}

            <div className="mx-auto w-full max-w-7xl pb-24 pt-12 print:hidden">
                <Link href="/" className="inline-flex items-center gap-3 font-screener text-[10px] uppercase tracking-[0.32em] text-foreground/55 transition-colors hover:text-foreground">
                    <span aria-hidden="true">←</span> Back to home
                </Link>
            </div>
        </main>
    );
}
