import Link from "next/link";

export function BackLink({ href = "/", label = "Back to work" }: { href?: string; label?: string }) {
    return (
        <section className="px-8 py-12 md:px-16 lg:px-24">
            <div className="mx-auto max-w-[1240px]">
                <Link href={href} className="inline-flex items-center gap-2 text-xs uppercase tracking-[0.5em] font-medium hover:opacity-70 transition-opacity">
                    ← {label}
                </Link>
            </div>
        </section>
    );
}
