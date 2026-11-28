import { and, asc, eq, inArray } from "drizzle-orm";
import { getDb } from "@/db";
import { heroImages, resumeActivities, resumeCertificates, resumeEducation, resumeExperiences, resumeProjects, resumeSkills, siteSettings, works as worksTable } from "@/db/schema";
import { ART, ART_MOBILE } from "@/features/landing-page/hero-section/config/art";
import { EDUCATION as staticEducation, EXPERIENCE as staticExperience, SKILLS as staticSkills } from "@/features/resume-page/resume-data";
import { siteConfig } from "@/lib/site";
import { proxyMedia, works as staticWorks, type Work } from "@/features/works/data";


function toWork(row: typeof worksTable.$inferSelect): Work {
    return {
        id: row.sortOrder + 1,
        name: row.name,
        tags: row.tags ?? [],
        media: row.posterUrl ?? "",
        mediaCaption: row.posterCaption ?? "",
        video: row.videoUrl ?? undefined,
        href: row.href ?? `/work/${row.slug}`,
        url: row.liveUrl ?? undefined,
        description: row.description,
        year: row.year,
        client: row.client,
        role: row.role,
        gallery:
            Array.isArray(row.galleryItems) && row.galleryItems.length
                ? row.galleryItems.map((item) => ({ url: String(item.url ?? ""), caption: String(item.caption ?? "") })).filter((item) => item.url)
                : (row.gallery ?? []).map((url) => ({ url, caption: "" })),
    };
}

async function retryOnce<T>(label: string, fn: () => Promise<T>, fallback: T): Promise<T> {
    for (let attempt = 0; attempt < 2; attempt++) {
        try {
            return await fn();
        } catch (err) {
            const e = err as { name?: string; message?: string; code?: string; cause?: { message?: string; code?: string } };
            console.error(`db-content:${label}${attempt === 0 ? " (retrying)" : ""}`, {
                name: e?.name,
                message: e?.message,
                code: e?.code,
                cause: e?.cause ? { message: e.cause.message, code: e.cause.code } : undefined,
            });
            if (attempt === 1) return fallback;
        }
    }
    return fallback;
}

export async function getWorks(): Promise<Work[]> {
    return retryOnce(
        "getWorks",
        async () => {
            const db = getDb();
            const rows = await db.select().from(worksTable).where(eq(worksTable.published, true)).orderBy(asc(worksTable.sortOrder));
            if (!rows.length) return [];
            return rows.map(toWork);
        },
        staticWorks,
    );
}

export async function getWorkBySlug(slug: string): Promise<Work | undefined> {
    const fallback = staticWorks.find((w) => w.href === `/work/${slug}`);
    return retryOnce(
        "getWorkBySlug",
        async () => {
            const db = getDb();
            const [row] = await db
                .select()
                .from(worksTable)
                .where(and(eq(worksTable.slug, slug), eq(worksTable.published, true)))
                .limit(1);
            if (!row) return fallback;
            return toWork(row);
        },
        fallback,
    );
}

export async function getHeroArt(): Promise<{ desktop: string[]; mobile: string[] }> {
    const fallbackDesktop = ART.length ? ART : ["/media-placeholder.svg"];
    const fallbackMobile = ART_MOBILE.length ? ART_MOBILE : ["/media-placeholder.svg"];
    const fallback = { desktop: fallbackDesktop, mobile: fallbackMobile };
    return retryOnce(
        "getHeroArt",
        async () => {
            const db = getDb();
            const rows = await db.select().from(heroImages).where(eq(heroImages.active, true)).orderBy(asc(heroImages.sortOrder));
            if (!rows.length) return fallback;
            const desktop = rows.map((r) => proxyMedia(r.imageUrl));
            const mobile = rows.map((r) => proxyMedia(r.mobileImageUrl || r.imageUrl));
            return { desktop, mobile };
        },
        fallback,
    );
}

export async function getReelVideoUrl(): Promise<string> {
    return retryOnce(
        "getReelVideoUrl",
        async () => {
            const db = getDb();
            const [row] = await db.select().from(siteSettings).where(eq(siteSettings.key, "reel_video_url")).limit(1);
            const value = row?.value?.trim();
            return value ? proxyMedia(value) : "";
        },
        "",
    );
}

export async function getReelNotes(): Promise<string> {
    return retryOnce(
        "getReelNotes",
        async () => {
            const db = getDb();
            const [row] = await db.select().from(siteSettings).where(eq(siteSettings.key, "reel_notes")).limit(1);
            return row?.value?.trim() || "";
        },
        "",
    );
}

export type ContactSocial = { label: string; href: string };
export async function getContactData(): Promise<{ email: string; phone: string; location: string; availability: string; socials: ContactSocial[] }> {
    return retryOnce(
        "getContactData",
        async () => {
            const db = getDb();
            const keys = ["contact_email", "contact_phone", "contact_location", "contact_availability", "contact_socials"];
            const rows = await db.select().from(siteSettings).where(inArray(siteSettings.key, keys));
            const map = Object.fromEntries(rows.map((r) => [r.key, r.value]));
            let socials: ContactSocial[] = [];
            try {
                const parsed = map.contact_socials ? JSON.parse(map.contact_socials) : null;
                if (Array.isArray(parsed)) socials = parsed.filter((s) => s && typeof s.label === "string" && typeof s.href === "string");
            } catch {}
            return {
                email: map.contact_email?.trim() || siteConfig.email,
                phone: map.contact_phone?.trim() || "+00 000 000 0000",
                location: map.contact_location?.trim() || "Lorem Ipsum, Dolor",
                availability: map.contact_availability?.trim() || "Lorem ipsum dolor sit amet",
                socials: socials.length ? socials : [
                    { label: "Instagram", href: "#" },
                    { label: "Twitter / X", href: "#" },
                    { label: "LinkedIn", href: "#" },
                    { label: "GitHub", href: "#" },
                    { label: "Dribbble", href: "#" },
                ],
            };
        },
        {
            email: siteConfig.email,
            phone: "+00 000 000 0000",
            location: "Lorem Ipsum, Dolor",
            availability: "Lorem ipsum dolor sit amet",
            socials: [
                { label: "Instagram", href: "#" },
                { label: "Twitter / X", href: "#" },
                { label: "LinkedIn", href: "#" },
                { label: "GitHub", href: "#" },
                { label: "Dribbble", href: "#" },
            ],
        },
    );
}

export type ResumeExperience = { role: string; company: string; period: string; description: string };
export type ResumeEducation = { degree: string; school: string; period: string; description: string };
export type ResumeSkillGroup = { category: string; items: string[] };
export type ResumeCertificate = { title: string; issuer: string; date: string; url?: string | null };
export type ResumeProject = { title: string; description: string; role: string; link?: string | null; period: string; tags: string[] };
export type ResumeActivity = { title: string; organization: string; period: string; description: string };
export type ResumeProfile = { name: string; title: string; phone: string; email: string; location: string; website: string; photoUrl: string; about: string };

export async function getResumeData(): Promise<{
    experiences: ResumeExperience[];
    education: ResumeEducation | null;
    skills: ResumeSkillGroup[];
    certificates: ResumeCertificate[];
    projects: ResumeProject[];
    activities: ResumeActivity[];
    profile: ResumeProfile;
    intro: string;
    availability: string;
}> {
    return retryOnce(
        "getResumeData",
        async () => {
            const db = getDb();
            const [
                expRows,
                eduRows,
                skillRows,
                certRows,
                projectRows,
                activityRows,
                introRow,
                availRow,
                nameRow,
                titleRow,
                phoneRow,
                emailRow,
                locationRow,
                websiteRow,
                photoRow,
                aboutRow,
            ] = await Promise.all([
                db.select().from(resumeExperiences).where(eq(resumeExperiences.published, true)).orderBy(asc(resumeExperiences.sortOrder)),
                db.select().from(resumeEducation).where(eq(resumeEducation.published, true)).orderBy(asc(resumeEducation.sortOrder)),
                db.select().from(resumeSkills).where(eq(resumeSkills.published, true)).orderBy(asc(resumeSkills.sortOrder)),
                db.select().from(resumeCertificates).where(eq(resumeCertificates.published, true)).orderBy(asc(resumeCertificates.sortOrder)),
                db.select().from(resumeProjects).where(eq(resumeProjects.published, true)).orderBy(asc(resumeProjects.sortOrder)),
                db.select().from(resumeActivities).where(eq(resumeActivities.published, true)).orderBy(asc(resumeActivities.sortOrder)),
                db.select().from(siteSettings).where(eq(siteSettings.key, "resume_intro")).limit(1),
                db.select().from(siteSettings).where(eq(siteSettings.key, "resume_availability")).limit(1),
                db.select().from(siteSettings).where(eq(siteSettings.key, "resume_name")).limit(1),
                db.select().from(siteSettings).where(eq(siteSettings.key, "resume_title")).limit(1),
                db.select().from(siteSettings).where(eq(siteSettings.key, "resume_phone")).limit(1),
                db.select().from(siteSettings).where(eq(siteSettings.key, "resume_email")).limit(1),
                db.select().from(siteSettings).where(eq(siteSettings.key, "resume_location")).limit(1),
                db.select().from(siteSettings).where(eq(siteSettings.key, "resume_website")).limit(1),
                db.select().from(siteSettings).where(eq(siteSettings.key, "resume_photo_url")).limit(1),
                db.select().from(siteSettings).where(eq(siteSettings.key, "resume_about")).limit(1),
            ]);

            return {
                experiences: expRows.map((r) => ({ role: r.role, company: r.company, period: r.period, description: r.description })),
                education: eduRows.length
                    ? { degree: eduRows[0].degree, school: eduRows[0].school, period: eduRows[0].period, description: eduRows[0].description }
                    : null,
                skills: skillRows.map((s) => ({ category: s.category, items: s.items ?? [] })),
                certificates: certRows.map((c) => ({ title: c.title, issuer: c.issuer, date: c.date, url: c.url })),
                projects: projectRows.map((p) => ({ title: p.title, description: p.description, role: p.role, link: p.link, period: p.period, tags: p.tags ?? [] })),
                activities: activityRows.map((a) => ({ title: a.title, organization: a.organization, period: a.period, description: a.description })),
                profile: {
                    name: nameRow[0]?.value?.trim() || "",
                    title: titleRow[0]?.value?.trim() || "",
                    phone: phoneRow[0]?.value?.trim() || "",
                    email: emailRow[0]?.value?.trim() || "",
                    location: locationRow[0]?.value?.trim() || "",
                    website: websiteRow[0]?.value?.trim() || "",
                    photoUrl: photoRow[0]?.value?.trim() || "",
                    about: aboutRow[0]?.value?.trim() || "",
                },
                intro: introRow[0]?.value?.trim() || "Creative generalist working across cinematography, 3D motion, and visual design.",
                availability: availRow[0]?.value?.trim() || "Available for collaborations",
            };
        },
        {
            // Fallback only on DB error/unavailability (e.g. tables not migrated yet)
            experiences: staticExperience.map((e) => ({ role: e.role, company: e.company, period: e.period, description: e.desc })),
            education: { degree: staticEducation.degree, school: staticEducation.school, period: staticEducation.period, description: staticEducation.desc },
            skills: staticSkills.map((s) => ({ category: s.cat, items: s.items })),
            certificates: [],
            projects: [],
            activities: [],
            profile: { name: "", title: "", phone: "", email: "", location: "", website: "", photoUrl: "", about: "" },
            intro: "Creative generalist working across cinematography, 3D motion, and visual design. Selected experience, skills, and education below.",
            availability: "Available for collaborations",
        },
    );
}
