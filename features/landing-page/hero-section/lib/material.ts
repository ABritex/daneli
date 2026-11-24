import * as THREE from "three";
import { BLUR_CUTOFF_PX, CARD_RADIUS } from "../config/config";

/* MeshBasicMaterial map sampling with (1) a cheap disc blur (uBlur = radius in uv units) and
   (2) the React Bits spiral card look: rounded corners (uShape = card
   size in px, corner radius in px, on-screen scale). keeps three's colour management; only the
   texture lookup / alpha are touched */
const BLUR_MAP_FRAGMENT = /* glsl */ `
#ifdef USE_MAP
  vec2 cuv = ( vMapUv - 0.5 ) * uCover + 0.5; /* object-fit: cover */
  vec4 sampledDiffuseColor = texture2D( map, cuv );
  if ( uBlur.x > 0.00001 ) {
    vec4 acc = sampledDiffuseColor;
    float wsum = 1.0;
    for ( int i = 1; i <= 16; i++ ) {
      float fi = float( i );
      float r = sqrt( fi / 16.0 );
      float a = fi * 2.399963;
      vec2 off = vec2( cos( a ), sin( a ) ) * r * uBlur;
      acc += texture2D( map, clamp( cuv + off * uCover, 0.0, 1.0 ) );
      wsum += 1.0;
    }
    sampledDiffuseColor = acc / wsum;
  }
  diffuseColor *= sampledDiffuseColor;
  if ( uShape.z > 0.001 ) {
    vec2 pp = ( vMapUv - 0.5 ) * uShape.xy;
    float aa = 0.5 / max( uShape.w, 0.1 );
    vec2 q = abs( pp ) - 0.5 * uShape.xy + uShape.z;
    float d = length( max( q, 0.0 ) ) + min( max( q.x, q.y ), 0.0 ) - uShape.z;
    diffuseColor.a *= 1.0 - smoothstep( -aa, aa, d );
  }
#endif
`;

export const attachBlur = (
  material: THREE.MeshBasicMaterial,
  blur: THREE.Vector2,
  shape: THREE.Vector4,
  cover: THREE.Vector2,
) => {
  material.onBeforeCompile = (shader) => {
    shader.uniforms.uBlur = { value: blur };
    shader.uniforms.uShape = { value: shape };
    shader.uniforms.uCover = { value: cover };
    shader.fragmentShader = shader.fragmentShader
      .replace("#include <common>", "#include <common>\nuniform vec2 uBlur;\nuniform vec4 uShape;\nuniform vec2 uCover;")
      .replace("#include <map_fragment>", BLUR_MAP_FRAGMENT);
  };
};

/* shared "do nothing" uniforms for the wall tiles (they only use the cover crop) */
export const NO_BLUR = new THREE.Vector2(0, 0);
export const NO_SHAPE = new THREE.Vector4(0, 0, 0, 1);

/* css-px blur -> uv-space radius for a card of the given on-screen size (~1.8 sigma disc) */
export const setBlur = (u: THREE.Vector2, px: number, size: THREE.Vector3) => {
  if (px < BLUR_CUTOFF_PX) {
    u.set(0, 0); /* shader skips its 16 extra texture taps */
    return;
  }
  const r = px * 1.8;
  u.set(r / Math.max(size.x, 1), r / Math.max(size.y, 1));
};