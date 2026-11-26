import type { RefObject } from "react";
import { SHAPES, toD } from "../lib/shapes";

type Props = {
    outerRef: RefObject<SVGPathElement | null>;
    innerRef: RefObject<SVGPathElement | null>;
};

// the morphing line shape behind the services list
export function ServiceFigure({ outerRef, innerRef }: Props) {
    return (
        <div aria-hidden="true" data-shape className="pointer-events-none absolute right-[2%] top-1/2 z-0 size-[clamp(240px,42vw,640px)] -translate-y-1/2 text-foreground/15 md:text-foreground/20">
            <svg viewBox="-1.2 -1.2 2.4 2.4" fill="none" stroke="currentColor" className="size-full">
                <path ref={outerRef} d={toD(SHAPES[0].outer)} strokeWidth="1" vectorEffect="non-scaling-stroke" strokeLinejoin="round" />
                <path ref={innerRef} d={toD(SHAPES[0].inner)} strokeWidth="1" vectorEffect="non-scaling-stroke" strokeLinejoin="round" />
            </svg>
        </div>
    );
}
