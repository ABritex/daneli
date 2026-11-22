import { gsap } from "gsap";

export const GLYPHS = "ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789/\\|<>+*^#";

export const clamp = (v: number, a: number, b: number) => Math.max(a, Math.min(b, v));

export const damp = (rate: number, dt: number) => 1 - Math.exp(-rate * dt);

export function scramble(el: HTMLElement, duration = 0.7): gsap.core.Tween | undefined {
  const to = el.dataset.text ?? el.textContent ?? "";
  const tweens = (el as { __scrambleTween?: gsap.core.Tween }).__scrambleTween;
  tweens?.kill();
  if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) {
    el.textContent = to;
    return;
  }
  const state = { p: 0 };
  const tween = gsap.to(state, {
    p: 1,
    duration,
    ease: "none",
    onUpdate: () => {
      const done = Math.floor(state.p * to.length);
      let out = to.slice(0, done);
      for (let i = done; i < to.length; i++) {
        out += to[i] === " " ? " " : GLYPHS[Math.floor(Math.random() * GLYPHS.length)];
      }
      el.textContent = out;
    },
    onComplete: () => {
      el.textContent = to;
    },
  });
  (el as { __scrambleTween?: gsap.core.Tween }).__scrambleTween = tween;
  return tween;
}

export function scrambleCardTags(card: Element | null | undefined) {
  card?.querySelectorAll<HTMLElement>("[data-tag]").forEach((t) => scramble(t));
}