import { ART } from "./art";

/* stage height and the scroll offset where the reels section begins */
export const STAGE_VH = 300; /* pinned scroll after the snap is only ~40vh now (was ~84vh of the wall just zooming/fading) */
/* the morph now spans almost the whole glide (it used to sit in the middle third,
   so it looked like: dead time -> sudden rush -> stop) */
export const TRANSITION_START = 0.06;
export const TRANSITION_END = 0.74;
export const SECTION_SPLIT = 0.34; /* only moves the #hero / #reels semantic markers */
export const HERO_MARKER_VH = (STAGE_VH - 100) * SECTION_SPLIT;
export const CAM_DIST = 1200; /* same perspective as the React Bits DriftWall (1200px); 900 made the wall converge too hard */

export const N = ART.length;
export const AUTO_SPEED = 0.25;
export const SCROLL_SPIN = 8;
export const MORPH_STAGGER = 0.3; /* fraction of the morph spent staggering card start times */
export const SPIN_P_CAP = 0.45; /* stop adding scroll-spin once the morph is underway so card start points don't whip around */

/* snap: hero -> reels glides on one gesture (ease in/out); from the reels onward the page scrolls normally */
export const SNAP_P = 0.8;
export const GLIDE_MS = 1600;
/* settle: if scrolling goes idle while the morph is part-way (momentum scroll up from the reels,
   a short flick, a stopped drag...), finish it instead of leaving cards frozen mid-flight */
export const SETTLE_IDLE_MS = 220;
export const SETTLE_FORWARD_P = 0.4; /* rest past this -> finish to the reels, before it -> back to the hero */
/* after a snap, swallow wheel events until the wheel has been quiet this long (a fresh gesture), capped by the max */
export const WHEEL_QUIET_MS = 140;
export const WHEEL_HOLD_MAX_MS = 1100;
export const CARDS_PER_TURN = 7;
export const CENTER_SCALE = 1.2;
export const EDGE_FADE = 0.8;
export const VIGNETTE =
    "radial-gradient(ellipse 78% 82% at 50% 46%, transparent 40%, var(--background) 100%), linear-gradient(to bottom, var(--background) 0%, transparent 60%)"; /* inverse of the DriftWall CSS mask. static, so only its opacity animates (compositor). the exit dissolve is the separate EXIT layer below, moved with transform instead of a CSS variable inside the gradient (which repainted a full-screen gradient every frame) */
export const CARD_RADIUS = 9; /* spiral card corner radius, React Bits cardRadius */
export const EDGE_BLUR = 10; /* px of blur on cards at the spiral's edges, same as the React Bits InfiniteSpiral default */
export const CARD_TILT = -10; /* deg, rotateZ on every card (React Bits cardTilt) */
export const SPIRAL_ROTATION = -50; /* deg, offset added to every card's angle around the helix (React Bits rotation) */
export const SPIRAL_RADIUS = 190;
export const SPIRAL_CARD_W = 116;
export const SPIRAL_CARD_H = 100;
export const SPIRAL_V_SPACING = 58;
export const SPIRAL_PERSPECTIVE = 925;
export const SPIRAL_SCALE = 1.5; /* uniform multiplier on card size, radius and spacing; the config is tuned for a 600px box, raise it for a full-screen hero */
export const PAUSE_ON_HOVER = true;

export const WALL_TILT = 16;
export const WALL_TURN = -14;
export const WALL_DEPTH = 120;
export const WALL_SCALE = 1.5; /* fallback / minimum (React Bits uses 1.18) */
export const WALL_SCALE_MAX = 3.2;
export const WALL_FILL = 1.0; /* target on-screen width of the wall as a multiple of the stage width */
export const WALL_PERSP_LOSS = 0.74; /* measured: yaw + perspective shrink the wall to ~74% of its flat width */
export const WALL_COLUMNS = 5;
export const WALL_RECENTER = 0.06; /* the yaw pushes the wall right on screen; shift it back by this fraction of the stage width */
export const WALL_TILE_W = 200; /* React Bits DriftWall tile: 200 x 132, gap 18, scale 1.18 */
export const WALL_ITEMS_PER_COL = 6;
export const WALL_SPEED = 42;
export const WALL_VARIANCE = 0.45;
export const WALL_PARALLAX_MAX_DEG = 0.6 * 8;
export const WALL_DIM = 0.55;
/* the reels start empty: a tile only appears as the spiral card for its image lands on it.
   the card fades out and the tile fades in over the same ki range, so the hand-off is seamless
   (lower = the card hands off earlier / the tile appears earlier) */
export const LAND_FROM = 0.9;
export const SPIRAL_DIM = 0.78;
export const WALL_SCROLL_BOOST_FACTOR = 0.35;
export const WALL_SCROLL_BOOST_MAX = 150;
export const WALL_EXIT_RISE = 160; /* wall drifts up as the stage unpins, instead of zooming + fading to black */

export const IGNORE_REDUCED_MOTION = true;

/* perf knobs */
export const ADAPTIVE_DPR = true; /* drop the canvas resolution a step when frames run long, creep back up when calm */
export const MAX_DPR = 2;
export const MIN_DPR = 1.25;
export const BLUR_CUTOFF_PX = 0.4; /* below this the 16-tap blur loop is skipped (it was running for sub-pixel blur during the morph) */
export const EXIT_BAND = 0.3; /* exit dissolve: soft edge height, as a fraction of the stage */
export const EXIT_TRAVEL = 0.6; /* exit dissolve: how far the edge rises, as a fraction of the stage */
/* selected reels: shown when no reel video is configured in admin */
export const REELS_VIDEO_PLACEHOLDER = "Reel coming soon";
