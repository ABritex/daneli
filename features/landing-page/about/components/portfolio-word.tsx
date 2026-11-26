type Layer = "back" | "front";

const WORD = "PORTFOLIO".split("");

// the big PORTFOLIO word, we render it twice (filled + outline) so the face can sit in between
export function PortfolioWord({ layer }: { layer: Layer }) {
    return (
        <span className="flex select-none font-monument font-extrabold uppercase leading-none" style={{ fontSize: "var(--word-size, 10vw)", color: "var(--foreground)" }} aria-hidden="true">
            {WORD.map((l, i) => (
                <span key={`${layer}${i}`} className="inline-block overflow-y-clip pb-[0.06em]">
                    <span
                        data-letter={layer}
                        className={layer === "back" ? "inline-block" : "inline-block text-transparent"}
                        style={layer === "front" ? { WebkitTextStroke: "2px rgba(230,229,224,0.95)" } : undefined}
                    >
                        {l}
                    </span>
                </span>
            ))}
        </span>
    );
}
