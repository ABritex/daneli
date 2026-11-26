export const PAGE_BG = "var(--background)";

/* the home cards are drawn on a WebGL plane that samples the video at 86% of the cropped frame
   (a 1.16x zoom, 1.28x while hovered). the morph overlay has to start and end at that same zoom,
   or the picture visibly pops when the card hands off to the overlay and back.
   keep in sync with `uv *= 0.86 - uHover * HOVER_ZOOM` in the featured works shader */
export const CARD_SAMPLE = 0.86;
export const CARD_HOVER_SAMPLE = 0.08;
export const FADE_ATTR = "data-work-fade";

export const REVEAL_EVENT = "work:reveal";

export const WORK_ATTR = "data-work";
export const WORK_CARD_ATTR = "data-work-card";
export const WORK_MEDIA_ATTR = "data-media";
export const WORK_TRANSITIONING_ATTR = "data-transitioning";
export const WORK_OVERLAY_ATTR = "data-work-overlay";
export const WORK_REVEALED_ATTR = "data-revealed";

export const DATA_HEAD = "[data-head]";
export const DATA_META = "[data-meta]";

export const LOADER_DONE_EVENT = "daneli-loader-done";
