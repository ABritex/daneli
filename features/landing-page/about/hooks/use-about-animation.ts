"use client";

import { useEffect, type RefObject } from "react";
import { gsap } from "gsap";
import { ScrollTrigger } from "gsap/ScrollTrigger";

gsap.registerPlugin(ScrollTrigger);

const IGNORE_REDUCED_MOTION = true;

type Args = {
  sectionRef: RefObject<HTMLElement | null>;
  measureRef: RefObject<HTMLSpanElement | null>;
  imageWrapRef: RefObject<HTMLDivElement | null>;
  setCopyDone: (v: boolean) => void;
};

export function useAboutAnimation({ sectionRef, measureRef, imageWrapRef, setCopyDone }: Args) {
  useEffect(() => {
    const section = sectionRef.current;
    const measure = measureRef.current;
    const imageWrap = imageWrapRef.current;
    if (!section || !measure || !imageWrap) return;

    const fit = () => {
      section.style.setProperty("--word-size", "100px");
      const emW = measure.offsetWidth / 100;
      const size = Math.min((window.innerWidth * 0.94) / emW, 256);
      section.style.setProperty("--word-size", `${size}px`);
    };

    fit();
    ScrollTrigger.addEventListener("refreshInit", fit);
    document.fonts?.ready.then(() => {
      fit();
      ScrollTrigger.refresh();
    });

    const q = gsap.utils.selector(section);
    const mm = gsap.matchMedia();

    mm.add({ reduce: "(prefers-reduced-motion: reduce)" }, (ctx) => {
      const { reduce } = ctx.conditions as { reduce: boolean };

      const image = q("[data-image]");
      const copyItems = q("[data-copy-item]");

      if (!IGNORE_REDUCED_MOTION && reduce) {
        gsap.set(q("[data-word-wrap]"), { autoAlpha: 0 });
        gsap.set(q("[data-image-wrap]"), { autoAlpha: 0 });
        gsap.set(copyItems, { opacity: 1, y: 0 });
        return;
      }

      gsap.set(copyItems, { opacity: 0, y: 24 });

      const backWrap = q("[data-word-wrap='back']");
      const frontWrap = q("[data-word-wrap='front']");
      const away = () => window.innerWidth / 2 + measure.offsetWidth / 2 + window.innerWidth * 0.05;

      // entry: image pops in, word layers slide in from sides
      const entry = gsap.timeline({
        defaults: { ease: "power3.out" },
        scrollTrigger: {
          trigger: section,
          start: "top 95%",
          end: "top 10%",
          scrub: 1,
          invalidateOnRefresh: true,
        },
      });

      // pinned part: word/image exit, copy comes in, then copy leaves before unpin
      const tl = gsap.timeline({
        scrollTrigger: {
          trigger: section,
          start: "top top",
          end: "bottom bottom",
          scrub: 1,
          invalidateOnRefresh: true,
        },
      });

      tl.to({}, { duration: 0.12 }); // little hold at start

      entry
        .fromTo(
          image,
          { clipPath: "circle(0% at 50% 100%)", scale: 1.25 },
          { clipPath: "circle(150% at 50% 100%)", scale: 1, duration: 0.8, ease: "power2.out" },
          0,
        )
        .fromTo(
          backWrap,
          { x: () => -away(), scale: 1.6, opacity: 0, filter: "blur(14px)", transformOrigin: "50% 50%" },
          { x: 0, scale: 1, opacity: 1, filter: "blur(0px)", duration: 0.8 },
          0.3,
        )
        .fromTo(
          frontWrap,
          { x: () => away(), scale: 1.35, opacity: 0, transformOrigin: "50% 50%" },
          { x: 0, scale: 1, opacity: 1, duration: 0.8 },
          0.5,
        );

      // exit the big stage stuff
      tl.to(
        frontWrap,
        { x: () => -away() * 0.35, scale: 3.2, opacity: 0, filter: "blur(10px)", ease: "power2.in", duration: 0.38 },
        0.12,
      )
        .to(backWrap, { x: () => away(), scale: 0.94, opacity: 0, ease: "power3.in", duration: 0.4 }, 0.18)
        .fromTo(
          image,
          { clipPath: "circle(150% at 50% 100%)", scale: 1 },
          { clipPath: "circle(0% at 50% 100%)", scale: 1.2, ease: "power2.in", duration: 0.3, immediateRender: false },
          0.3,
        );

      // bring in copy, mark when its done for the highlighter, then fade it out before leaving
      tl.to(copyItems, { opacity: 1, y: 0, duration: 0.35, ease: "power3.out" }, 0.62);
      tl.addLabel("copyDone", ">");
      tl.to(
        copyItems,
        { opacity: 0, y: -30, filter: "blur(4px)", duration: 0.2, ease: "power2.inOut" },
        1.15,
      );
      tl.to({}, { duration: 0.1 });

      tl.eventCallback("onUpdate", () =>
        setCopyDone(tl.time() >= (tl.labels.copyDone ?? Infinity) - 0.001),
      );
    }, section);

    return () => {
      ScrollTrigger.removeEventListener("refreshInit", fit);
      mm.revert();
    };
  }, [sectionRef, measureRef, imageWrapRef, setCopyDone]);
}
