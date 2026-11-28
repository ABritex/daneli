type Props = {
    contact: {
        email: string;
        phone: string;
        location: string;
        availability: string;
    };
};

export function ContactInfo({ contact }: Props) {
    const items = [
        { label: "Email", value: contact.email, href: `mailto:${contact.email}` },
        { label: "Phone", value: contact.phone, href: `tel:${contact.phone.replace(/[^+\d]/g, "")}` },
        { label: "Location", value: contact.location, href: "#" },
        { label: "Availability", value: contact.availability, href: "#" },
    ];
    return (
        <div>
            <p className="font-screener text-[10px] uppercase tracking-[0.32em] text-foreground/45">Details</p>
            <div className="mt-8 grid grid-cols-1 gap-10 sm:grid-cols-2">
                {items.map((c) => (
                    <div key={c.label} className="border-t border-foreground/15 pt-5">
                        <p className="font-screener text-[10px] uppercase tracking-[0.28em] text-foreground/45">{c.label}</p>
                        <a href={c.href} className="mt-3 inline-block text-lg font-medium tracking-tight text-foreground transition-opacity hover:opacity-70 md:text-xl">
                            {c.value}
                        </a>
                    </div>
                ))}
            </div>
        </div>
    );
}
