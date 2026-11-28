import type { ContactSocial } from "@/lib/db-content";

type Props = {
    socials: ContactSocial[];
};

export function SocialLinks({ socials }: Props) {
    const items = socials?.length
        ? socials
        : [
              { label: "Instagram", href: "#" },
              { label: "Twitter / X", href: "#" },
              { label: "LinkedIn", href: "#" },
              { label: "GitHub", href: "#" },
              { label: "Dribbble", href: "#" },
          ];
    return (
        <div>
            <p className="font-screener text-[10px] uppercase tracking-[0.32em] text-foreground/45">Social</p>
            <div className="mt-6 flex flex-wrap gap-x-8 gap-y-4">
                {items.map((s) => (
                    <a
                        key={s.label}
                        href={s.href || "#"}
                        target={s.href && s.href !== "#" ? "_blank" : undefined}
                        rel={s.href && s.href !== "#" ? "noopener noreferrer" : undefined}
                        className="font-mono text-[11px] uppercase tracking-[0.2em] text-foreground/65 transition-colors hover:text-foreground"
                    >
                        {s.label}
                    </a>
                ))}
            </div>
        </div>
    );
}
