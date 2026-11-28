import type { ResumeActivity, ResumeCertificate, ResumeEducation, ResumeExperience, ResumeProfile, ResumeProject, ResumeSkillGroup } from "@/lib/db-content";

// everything the PDF needs. the page's `resume` prop already satisfies this (extra fields are fine)
export type ResumeData = {
    profile: ResumeProfile;
    experiences: ResumeExperience[];
    education: ResumeEducation | null;
    skills: ResumeSkillGroup[];
    certificates: ResumeCertificate[];
    projects: ResumeProject[];
    activities: ResumeActivity[];
};

// react-pdf only reads jpg/png, and the admin photo can be webp/avif (or on another origin).
// draw it to a canvas and hand back a jpeg data url; null means "skip the photo"
async function photoToDataUrl(url: string): Promise<string | null> {
    try {
        const res = await fetch(url);
        if (!res.ok) return null;
        const bitmap = await createImageBitmap(await res.blob());
        const scale = Math.min(1, 600 / Math.max(bitmap.width, bitmap.height));
        const canvas = document.createElement("canvas");
        canvas.width = Math.round(bitmap.width * scale);
        canvas.height = Math.round(bitmap.height * scale);
        const ctx = canvas.getContext("2d");
        if (!ctx) return null;
        ctx.fillStyle = "#fff";
        ctx.fillRect(0, 0, canvas.width, canvas.height);
        ctx.drawImage(bitmap, 0, 0, canvas.width, canvas.height);
        return canvas.toDataURL("image/jpeg", 0.9);
    } catch {
        return null;
    }
}

const isHttp = (u: string) => /^https?:\/\//i.test(u.trim());
const isEmail = (e: string) => /^\S+@\S+\.\S+$/.test(e.trim());

const lines = (text: string) =>
    text
        .split(/\n+/)
        .map((l) => l.trim())
        .filter(Boolean);

// builds the <Document>. layout copies DEL_VILLAR_Resume_2026.pdf: US Letter, 1in side margins,
// photo + name block, ruled section headings, period in a left column, entry details on the right
export async function createResumeElement(resume: ResumeData, photo: string | null = null) {
    const { Document, Page, Text, View, Image, Link, StyleSheet, Font } = await import("@react-pdf/renderer");
    Font.registerHyphenationCallback((word) => [word]); // no mid-word breaks in justified bullets
    const p = resume.profile;

    const s = StyleSheet.create({
        page: { paddingTop: 72, paddingBottom: 60, paddingHorizontal: 72, fontFamily: "Helvetica", fontSize: 10.5, lineHeight: 1.25, color: "#000" },

        // header: photo left, name + contacts right, rule underneath
        header: { flexDirection: "row", alignItems: "center", paddingBottom: 30, borderBottomWidth: 1, borderBottomColor: "#000" },
        photo: { width: 100, height: 92, objectFit: "cover", marginLeft: 6, marginRight: 14 },
        headerText: { flex: 1, paddingLeft: 6 },
        name: { fontFamily: "Helvetica-Bold", fontSize: 16, marginBottom: 6 },
        subtitle: { fontSize: 10.5 },
        contact: { fontSize: 8, lineHeight: 1.2, marginTop: 1.5 },
        link: { color: "#0000ee", textDecoration: "underline" },

        // section heading with full-width rule
        h2Wrap: { marginTop: 22, borderBottomWidth: 1, borderBottomColor: "#000", paddingBottom: 1, marginBottom: 6 },
        h2: { fontFamily: "Helvetica-Bold", fontSize: 12 },
        about: { fontSize: 10.5 },

        // entry: period column + details column
        entry: { flexDirection: "row", marginTop: 10 },
        period: { width: 113, paddingLeft: 5, fontFamily: "Helvetica-Bold", fontSize: 10.5 },
        body: { flex: 1, paddingRight: 4 },
        title: { fontFamily: "Helvetica-Bold", fontSize: 10.5 },
        titleLink: { color: "#3a7c8f", textDecoration: "underline" },
        sub: { fontFamily: "Helvetica-Oblique", fontSize: 9, marginTop: 1 },
        row: { flexDirection: "row", marginTop: 4 },
        bullet: { width: 12, fontSize: 9 },
        bulletText: { flex: 1, fontSize: 9, textAlign: "justify", lineHeight: 1.3 },
        small: { fontSize: 8.5, marginTop: 4 },

        // skills
        skillGroup: { marginTop: 8, paddingLeft: 6 },
        skillHead: { flexDirection: "row", alignItems: "center" },
        square: { width: 4, height: 4, backgroundColor: "#000", marginRight: 8, marginLeft: 1 },
        skillName: { fontFamily: "Helvetica-Bold", fontSize: 10 },
        skillItem: { flexDirection: "row", marginLeft: 22, marginTop: 3 },
        circle: { width: 14, fontSize: 10 },
        skillText: { flex: 1, fontSize: 10 },
    });

    const Bullets = ({ text }: { text: string }) => (
        <>
            {lines(text).map((l, i) => (
                <View key={i} style={s.row}>
                    <Text style={s.bullet}>•</Text>
                    <Text style={s.bulletText}>{l}</Text>
                </View>
            ))}
        </>
    );

    // heading + rule, kept together with the first entry below it
    const Section = ({ title, children }: { title: string; children: React.ReactNode }) => (
        <View>
            <View style={s.h2Wrap} minPresenceAhead={70}>
                <Text style={s.h2}>{title}</Text>
            </View>
            {children}
        </View>
    );

    const Entry = ({ period, children }: { period?: string; children: React.ReactNode }) => (
        <View style={s.entry} wrap={false}>
            <Text style={s.period}>{period || ""}</Text>
            <View style={s.body}>{children}</View>
        </View>
    );

    const hasProjects = resume.projects.length > 0 || resume.activities.length > 0;

    return (
        <Document title={`${p.name || "Resume"} — Resume`} author={p.name || undefined}>
            <Page size="LETTER" style={s.page}>
                <View style={s.header}>
                    {photo ? (
                        // eslint-disable-next-line jsx-a11y/alt-text -- react-pdf Image has no alt prop
                        <Image src={photo} style={s.photo} />
                    ) : null}
                    <View style={[s.headerText, photo ? {} : { paddingLeft: 0 }]}>
                        <Text style={s.name}>{p.name || "Resume"}</Text>
                        {p.title ? <Text style={s.subtitle}>{p.title}</Text> : null}
                        {p.phone ? <Text style={s.contact}>{p.phone}</Text> : null}
                        {p.email ? (
                            <Text style={s.contact}>
                                {isEmail(p.email) ? (
                                    <Link src={`mailto:${p.email.trim()}`} style={s.link}>
                                        {p.email}
                                    </Link>
                                ) : (
                                    p.email
                                )}
                            </Text>
                        ) : null}
                        {p.website ? (
                            <Text style={s.contact}>
                                {isHttp(p.website) ? (
                                    <Link src={p.website.trim()} style={s.link}>
                                        {p.website}
                                    </Link>
                                ) : (
                                    p.website
                                )}
                            </Text>
                        ) : null}
                        {p.location ? <Text style={s.contact}>{p.location}</Text> : null}
                    </View>
                </View>

                {p.about ? (
                    <Section title="About Me">
                        <Text style={s.about}>{p.about}</Text>
                    </Section>
                ) : null}

                {resume.education ? (
                    <Section title="Education">
                        <Entry period={resume.education.period}>
                            <Text style={s.title}>{resume.education.degree}</Text>
                            {resume.education.school ? <Text style={s.sub}>{resume.education.school}</Text> : null}
                            {resume.education.description ? <Bullets text={resume.education.description} /> : null}
                        </Entry>
                    </Section>
                ) : null}

                {resume.experiences.length > 0 ? (
                    <Section title="Work Experiences">
                        {resume.experiences.map((e, i) => (
                            <Entry key={`${e.role}-${i}`} period={e.period}>
                                <Text style={s.title}>{e.role}</Text>
                                {e.company ? <Text style={s.sub}>{e.company}</Text> : null}
                                {e.description ? <Bullets text={e.description} /> : null}
                            </Entry>
                        ))}
                    </Section>
                ) : null}

                {hasProjects ? (
                    <Section title="Projects & Activities">
                        {resume.projects.map((x, i) => (
                            <Entry key={`${x.title}-${i}`} period={x.period}>
                                <Text style={s.title}>
                                    {x.link && isHttp(x.link) ? (
                                        <Link src={x.link.trim()} style={s.titleLink}>
                                            {x.title}
                                        </Link>
                                    ) : (
                                        x.title
                                    )}
                                </Text>
                                {x.role ? <Text style={s.sub}>{x.role}</Text> : null}
                                {x.description ? <Bullets text={x.description} /> : null}
                                {x.tags.length > 0 ? <Text style={s.small}>{x.tags.join("  •  ")}</Text> : null}
                                {x.link && !isHttp(x.link) ? <Text style={s.small}>{x.link}</Text> : null}
                            </Entry>
                        ))}
                        {resume.activities.map((a, i) => (
                            <Entry key={`${a.title}-${i}`} period={a.period}>
                                <Text style={s.title}>{a.title}</Text>
                                {a.organization ? <Text style={s.sub}>{a.organization}</Text> : null}
                                {a.description ? <Bullets text={a.description} /> : null}
                            </Entry>
                        ))}
                    </Section>
                ) : null}

                {resume.skills.length > 0 ? (
                    <Section title="Skills">
                        {resume.skills.map((g) => (
                            <View key={g.category} style={s.skillGroup} wrap={false}>
                                <View style={s.skillHead}>
                                    <View style={s.square} />
                                    <Text style={s.skillName}>{g.category}</Text>
                                </View>
                                {g.items.map((item) => (
                                    <View key={item} style={s.skillItem}>
                                        <Text style={s.circle}>o</Text>
                                        <Text style={s.skillText}>{item}</Text>
                                    </View>
                                ))}
                            </View>
                        ))}
                    </Section>
                ) : null}

                {resume.certificates.length > 0 ? (
                    <Section title="Certificates">
                        {resume.certificates.map((c, i) => (
                            <Entry key={`${c.title}-${i}`} period={c.date}>
                                <Text style={s.title}>
                                    {c.url && isHttp(c.url) ? (
                                        <Link src={c.url.trim()} style={s.titleLink}>
                                            {c.title}
                                        </Link>
                                    ) : (
                                        c.title
                                    )}
                                </Text>
                                {c.issuer ? <Text style={s.sub}>{c.issuer}</Text> : null}
                            </Entry>
                        ))}
                    </Section>
                ) : null}
            </Page>
        </Document>
    );
}

export async function buildResumePdf(resume: ResumeData): Promise<Blob> {
    const [{ pdf }, photo] = await Promise.all([import("@react-pdf/renderer"), resume.profile.photoUrl ? photoToDataUrl(resume.profile.photoUrl) : Promise.resolve(null)]);
    return pdf(await createResumeElement(resume, photo)).toBlob();
}
