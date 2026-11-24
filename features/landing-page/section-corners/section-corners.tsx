"use client";

import { useEffect, useState } from "react";
import { CornerText } from "./components/corner-text";
import { SECTIONS } from "./config";

export function SectionCorners() {
  const [activeId, setActiveId] = useState<string | null>(null);
  const [visible, setVisible] = useState(false);

  useEffect(() => {
    const elements = SECTIONS.map((s) => document.getElementById(s.id)).filter(
      (el): el is HTMLElement => Boolean(el),
    );
    if (elements.length === 0) return;

    const ratios = new Map<string, number>();

    const observer = new IntersectionObserver(
      (entries) => {
        for (const entry of entries) {
          ratios.set((entry.target as HTMLElement).id, entry.isIntersecting ? entry.intersectionRatio : 0);
        }

        let bestId: string | null = null;
        let bestRatio = 0;
        for (const section of SECTIONS) {
          const ratio = ratios.get(section.id) ?? 0;
          if (ratio > bestRatio) {
            bestRatio = ratio;
            bestId = section.id;
          }
        }

        if (bestId && bestRatio > 0.15) {
          setActiveId(bestId);
          setVisible(true);
        } else {
          setVisible(false);
        }
      },
      { threshold: [0, 0.15, 0.3, 0.5, 0.7], rootMargin: "-10% 0px -10% 0px" },
    );

    for (const el of elements) observer.observe(el);
    return () => observer.disconnect();
  }, []);

  const active = SECTIONS.find((s) => s.id === activeId) ?? null;

  return (
    <div
      aria-hidden="true"
      className={`pointer-events-none fixed inset-0 z-[36] transition-opacity duration-500 ${
        visible && active ? "opacity-100" : "opacity-0"
      }`}
    >
      <CornerText position="top-left">{active?.topLeft}</CornerText>
      <CornerText position="top-right">{active?.topRight}</CornerText>
      <CornerText position="bottom-left">{active?.bottomLeft}</CornerText>
      <CornerText position="bottom-right">{active?.bottomRight}</CornerText>
    </div>
  );
}
