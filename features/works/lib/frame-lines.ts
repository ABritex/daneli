import { gsap } from "gsap";

// the four fixed site-frame lines (see NavFrameLines)
const FRAME_LINES = "[data-frame-line]";

// the draw-in currently playing on the frame lines, so a new one can take over
let frameDrawTl: gsap.core.Timeline | undefined;

// the lines are hidden while a morph runs; they are re-drawn once the new page has settled
export const hideFrameLines = () => {
  frameDrawTl?.kill();
  gsap.killTweensOf(FRAME_LINES);
  gsap.to(FRAME_LINES, { opacity: 0, duration: 0.25, ease: "power1.out", overwrite: true });
};

export const drawFrameLines = () => {
  const xs = Array.from(document.querySelectorAll<HTMLElement>(`${FRAME_LINES}.line-x`));
  const ys = Array.from(document.querySelectorAll<HTMLElement>(`${FRAME_LINES}.line-y`));
  const all = [...xs, ...ys];
  if (!all.length) return;

  frameDrawTl?.kill();
  gsap.killTweensOf(FRAME_LINES);
  // take over from css intro, just reveal with clip
  all.forEach((el) => {
    el.style.animation = "none";
    el.style.opacity = "1";
    el.style.transform = "none";
  });

  frameDrawTl = gsap.timeline({
    defaults: { duration: 0.9, ease: "power3.inOut" },
    onComplete: () => all.forEach((el) => (el.style.clipPath = "")),
  });
  // horizontals: left -> right
  if (xs.length) {
    frameDrawTl.fromTo(
      xs,
      { clipPath: "inset(0% 100% 0% 0%)" },
      { clipPath: "inset(0% 0% 0% 0%)", stagger: 0.1 },
      0,
    );
  }
  // verticals: top -> bottom
  if (ys.length) {
    frameDrawTl.fromTo(
      ys,
      { clipPath: "inset(0% 0% 100% 0%)" },
      { clipPath: "inset(0% 0% 0% 0%)", stagger: 0.1 },
      0.15,
    );
  }
};
