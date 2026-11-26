import { TextAnimate } from "@/components/effects";

type TagListProps = {
    tags: string[];
    as?: "div" | "p";
    className?: string;
    itemClassName?: string;
    separatorClassName?: string;
    animated?: boolean;
    "data-meta"?: string;
    "data-reveal"?: string;
    "data-i"?: string;
};

export function TagList({ tags, as: Comp = "div", className, itemClassName = "flex items-center gap-2", separatorClassName, animated = false, ...rest }: TagListProps) {
    return (
        <Comp {...rest} className={className}>
            {tags.map((t, k) => (
                <span key={t} className={itemClassName}>
                    {k > 0 && <span className={separatorClassName}>•</span>}
                    {animated ? (
                        <span data-tag data-text={t} className="text-foreground font-bold">
                            <TextAnimate as="span">{t}</TextAnimate>
                        </span>
                    ) : (
                        t
                    )}
                </span>
            ))}
        </Comp>
    );
}
