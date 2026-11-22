import * as THREE from "three";

export const clamp = (v: number, a: number, b: number) => Math.min(Math.max(v, a), b);
export const mod = (v: number, d: number) => ((v % d) + d) % d;
export const smooth = (a: number, b: number, v: number) => {
  const x = clamp((v - a) / ((b - a) || 1), 0, 1);
  return x * x * (3 - 2 * x);
};
export const colFactor = (i: number, variance: number) =>
  1 + variance * ((((i * 0.6180339887 + 0.35) % 1) * 2) - 1);

/* crop the texture to the mesh's aspect like css object-fit: cover (no more stretched images) */
export const setCover = (u: THREE.Vector2, tex: THREE.Texture, aspect: number) => {
  const img = tex.image as { width?: number; height?: number } | undefined;
  const iw = img?.width ?? 0;
  const ih = img?.height ?? 0;
  if (!iw || !ih) {
    u.set(1, 1);
    return;
  }
  const ia = iw / ih;
  if (ia > aspect) u.set(aspect / ia, 1);
  else u.set(1, ia / aspect);
};