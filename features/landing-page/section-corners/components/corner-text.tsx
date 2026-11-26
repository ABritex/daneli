type Props = {
    position: "top-left" | "top-right" | "bottom-left" | "bottom-right";
    children?: string;
};

const POS_CLASS: Record<Props["position"], string> = {
    "top-left": "left-8 top-6 hidden md:left-12 md:block",
    "top-right": "right-8 top-6 hidden text-right md:right-12 md:block",
    "bottom-left": "bottom-6 left-8 md:left-12",
    "bottom-right": "bottom-6 right-8 text-right md:right-12",
};

export function CornerText({ position, children }: Props) {
    return (
        <div className={`absolute ${POS_CLASS[position]} font-screener text-[10px] uppercase tracking-[0.32em] text-foreground/45 transition-all duration-500`}>
            <span key={children} className="inline-block animate-[fadeSlide_.5s_ease-out]">
                {children}
            </span>
        </div>
    );
}
