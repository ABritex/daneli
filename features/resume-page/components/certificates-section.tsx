import type { ResumeCertificate } from "@/lib/db-content";

type Props = { certificates: ResumeCertificate[] };

export function CertificatesSection({ certificates }: Props) {
    if (certificates.length === 0) return null;
    return (
        <section className="mx-auto w-full max-w-7xl py-20 md:py-28">
            <div className="grid grid-cols-1 gap-10 border-t border-foreground/15 pt-10 md:grid-cols-12 md:gap-8">
                <div className="md:col-span-3">
                    <p className="font-screener text-[10px] uppercase tracking-[0.32em] text-foreground/45">04 — Certificates</p>
                </div>

                <div className="space-y-8 md:col-span-9">
                    {certificates.map((c, i) => (
                        <div key={`${c.title}-${i}`} className="grid grid-cols-1 gap-3 border-b border-foreground/10 pb-8 md:grid-cols-12 md:gap-6">
                            <div className="md:col-span-8">
                                <h3 className="font-monument text-[clamp(1.1rem,2vw,1.6rem)] font-extrabold uppercase leading-[1.05] tracking-[-0.01em] text-foreground">{c.title}</h3>
                                <p className="mt-3 font-mono text-[11px] uppercase tracking-[0.2em] text-foreground/55">{c.issuer}</p>
                                {c.url ? (
                                    <a
                                        href={c.url}
                                        target="_blank"
                                        rel="noopener noreferrer"
                                        className="mt-3 inline-block font-screener text-[10px] uppercase tracking-[0.28em] text-foreground/60 underline-offset-4 hover:underline"
                                    >
                                        View credential
                                    </a>
                                ) : null}
                            </div>
                            <div className="md:col-span-4 md:text-right">
                                <span className="font-screener text-[10px] uppercase tracking-[0.28em] text-foreground/45">{c.date}</span>
                            </div>
                        </div>
                    ))}
                </div>
            </div>
        </section>
    );
}
