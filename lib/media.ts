import { useSyncExternalStore } from "react";

export const MQ_REDUCED_MOTION = "(prefers-reduced-motion: reduce)";
export const MQ_NARROW_900 = "(max-width: 900px)";
export const MQ_NARROW_768 = "(max-width: 768px)";
export const MQ_DESKTOP_768 = "(min-width: 768px)";
export const MQ_HOVER = "(hover: hover)";
export const MQ_COARSE = "(pointer: coarse)";

export function mediaMatches(query: string) {
  return typeof window !== "undefined" && window.matchMedia(query).matches;
}

function subscribe(query: string, onChange: () => void) {
  const mql = window.matchMedia(query);
  mql.addEventListener("change", onChange);
  return () => mql.removeEventListener("change", onChange);
}

export function useMediaQuery(query: string) {
  return useSyncExternalStore(
    (onChange) => subscribe(query, onChange),
    () => mediaMatches(query),
    () => false,
  );
}
