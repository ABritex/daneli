import { cn } from "@/lib/utils";

type GridLineProps = React.ComponentPropsWithoutRef<"div"> & {
  /** CSS delay for the intro draw; maps to --line-delay. */
  delay?: string;
};

/**
 * Horizontal page-grid rule. No z-index by default, so it sits with page
 * content (below the drafting cursor and fixed header). Add `z-[10005]` when
 * the line must sit above the cursor, and keep it out of ancestors that create
 * a stacking context (transform/filter/backdrop-filter/opacity).
 */
export function GridLine({ delay, className, style, ...props }: GridLineProps) {
  return (
    <div
      {...props}
      aria-hidden="true"
      style={
        {
          ...(delay ? { "--line-delay": delay } : {}),
          ...style,
        } as React.CSSProperties
      }
      className={cn(
        "line-x pointer-events-none absolute left-0 right-0 border-t border-foreground",
        className,
      )}
    />
  );
}
