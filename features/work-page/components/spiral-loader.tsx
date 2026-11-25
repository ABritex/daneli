import type { Ref } from "react";

const SPIRAL_D = (() => {
  let d = "";
  for (let t = 0; t <= 6 * Math.PI; t += 0.15) {
    const r = 2 + t * 1.15;
    d += `${d ? "L" : "M"}${(32 + r * Math.cos(t)).toFixed(2)} ${(32 + r * Math.sin(t)).toFixed(2)}`;
  }
  return d;
})();

type SpiralLoaderProps = {
  spiralRef: Ref<SVGPathElement>;
  spiralSvgRef: Ref<SVGSVGElement>;
};

export function SpiralLoader({ spiralRef, spiralSvgRef }: SpiralLoaderProps) {
  return (
    <svg
      ref={spiralSvgRef}
      viewBox="0 0 64 64"
      className="size-16 shrink-0 text-[#070707] md:size-20"
      fill="none"
      stroke="currentColor"
      strokeWidth="1.6"
      strokeLinecap="round"
      aria-hidden="true"
    >
      <path d={SPIRAL_D} opacity="0.15" />
      <path ref={spiralRef} d={SPIRAL_D} />
    </svg>
  );
}
