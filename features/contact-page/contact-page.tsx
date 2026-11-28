import Link from "next/link";
import type { ContactSocial } from "@/lib/db-content";
import { ContactForm } from "./contact-form";
import { ContactInfo } from "./contact-info";
import { SocialLinks } from "./social-links";

type Props = {
    contact: {
        email: string;
        phone: string;
        location: string;
        availability: string;
        socials: ContactSocial[];
    };
};

export function ContactPage({ contact }: Props) {
    return (
        <main className="min-h-screen bg-background px-6 pt-32 text-foreground md:px-12 md:pt-40">
            <div className="mx-auto w-full max-w-7xl">
                <div className="border-b border-foreground/15 pb-16 md:pb-20">
                    <p className="font-screener text-[10px] uppercase tracking-[0.32em] text-foreground/45">Contact</p>
                    <h1 className="mt-6 font-monument text-[clamp(3.2rem,12vw,10rem)] font-extrabold uppercase leading-[0.88] tracking-[-0.02em] text-foreground">
                        Let&apos;s
                        <br className="hidden sm:block" />
                        Talk
                    </h1>
                    <p className="mt-8 max-w-2xl text-base leading-relaxed text-foreground/65 md:text-lg">
                        For collaborations, commissions, or just to say hello — reach out and I’ll get back to you.
                    </p>
                </div>
            </div>

            <section className="mx-auto w-full max-w-7xl py-16 md:py-24">
                <div className="grid grid-cols-1 gap-16 lg:grid-cols-12 lg:gap-16">
                    <div className="lg:col-span-5">
                        <ContactInfo contact={contact} />
                        <div className="mt-16 border-t border-foreground/15 pt-10">
                            <SocialLinks socials={contact.socials} />
                        </div>
                    </div>
                    <div className="lg:col-span-7">
                        <ContactForm email={contact.email} />
                    </div>
                </div>
            </section>

            <div className="mx-auto w-full max-w-7xl pb-24 pt-6">
                <Link href="/" className="inline-flex items-center gap-3 font-screener text-[10px] uppercase tracking-[0.32em] text-foreground/55 transition-colors hover:text-foreground">
                    <span aria-hidden="true">←</span> Back to home
                </Link>
            </div>
        </main>
    );
}
