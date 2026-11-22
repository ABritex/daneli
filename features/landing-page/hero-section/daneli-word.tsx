"use client";

/** Brand wordmark set in Monument Extended Ultrabold. */
export function DaneliWord({ className = "" }: { className?: string }) {
  return (
    <span
      className={`block font-monument font-extrabold uppercase leading-none ${className}`}
    >
      DANELI
    </span>
  );
}
