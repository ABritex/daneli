import { CURVE_CENTER, CURVE_DEPTH, CURVE_SATURATE, HOVER_DRIFT, HOVER_ZOOM, MOTION_BLUR, PRISM, TILT, TILT_LOWER, TILT_UP } from "../config/scene";

// vertex shader: bends cards a bit based on scroll speed / screen position
export const vertexShader = /* glsl */ `
  uniform float uVel;
  uniform vec2  uViewport;  // css px
  uniform float uAmp;       // 0 when reduced motion is on
  varying vec2 vUv;
  void main() {
    vUv = uv;
    vec4 wp = modelMatrix * vec4(position, 1.0);

    float screenY = uViewport.y * 0.5 - wp.y;                 // px from top of viewport
    float dyn = (screenY - uViewport.y * ${CURVE_CENTER.toFixed(3)}) / (uViewport.y * 0.5); // -1 top .. +1 bottom

    float amt = uAmp * (1.0 - exp(-${CURVE_SATURATE.toFixed(2)} * abs(uVel)));    // 0 .. 1
    wp.z += amt * uViewport.y * ${CURVE_DEPTH.toFixed(4)} * dyn * dyn;

    // tilt a bit while scrolling so cards feel like they ride the motion
    float xn = wp.x / (uViewport.x * 0.5);                    // -1 left .. +1 right
    float dc = clamp(dyn, -1.0, 1.0);
    float wave = dc < 0.0 ? 4.0 * (-dc) * (1.0 + dc)
                          : -${TILT_LOWER.toFixed(3)} * 4.0 * dc * (1.0 - dc);
    float dir = uVel >= 0.0 ? 1.0 : -${TILT_UP.toFixed(3)};
    wp.y -= dir * amt * uViewport.y * ${TILT.toFixed(4)} * wave * xn * xn;

    gl_Position = projectionMatrix * viewMatrix * wp;
  }
`;

// fragment shader: rounded corners, hover zoom/drift, a bit of prism + motion blur on scroll
export const fragmentShader = /* glsl */ `
  precision highp float;
  uniform sampler2D uTex;
  uniform vec2 uUvScale;   // "object-fit: cover" crop
  uniform float uFade;     // 0 -> 1 entrance fade
  uniform float uHover;    // 0 -> 1 hover amount (eased in JS)
  uniform vec2  uMouse;    // -1..1 cursor position inside the card
  uniform float uPar;      // -1..1 parallax position
  uniform float uVel;      // scroll velocity (signed)
  uniform float uAmp;      // 0 when reduced motion is on
  uniform vec2 uSize;      // card size in css px
  uniform float uRadius;   // corner radius in css px
  varying vec2 vUv;

  void main() {
    vec2 p = (vUv - 0.5) * uSize;
    vec2 q = abs(p) - (uSize * 0.5 - uRadius);
    float sdf = length(max(q, 0.0)) + min(max(q.x, q.y), 0.0) - uRadius;
    float edge = 1.0 - smoothstep(-1.0, 0.5, sdf);
    if (edge < 0.01) discard;

    vec2 uv = (vUv - 0.5) * uUvScale;
    uv *= 0.86 - uHover * ${HOVER_ZOOM.toFixed(4)};
    uv.y += uPar * 0.06;
    uv += vec2(uMouse.x, -uMouse.y) * ${HOVER_DRIFT.toFixed(4)} * uHover;
    uv += 0.5;

    float fx = uAmp * (1.0 - exp(-${CURVE_SATURATE.toFixed(2)} * abs(uVel)));
    float dir = uVel >= 0.0 ? 1.0 : -1.0;

    vec3 col;
    if (fx < 0.01) {
      col = texture2D(uTex, uv).rgb;
    } else {
      vec2 c = vUv - 0.5;
      vec2 split = vec2(c.x * 0.8, dir * 0.6 + c.y * 0.6) * fx * ${PRISM.toFixed(4)};

      vec3 acc = vec3(0.0);
      float wsum = 0.0;
      for (int i = 0; i < 9; i++) {
        float t = float(i) / 4.0 - 1.0;
        float w = exp(-t * t * 2.2);
        vec2 o = vec2(0.0, t * fx * ${MOTION_BLUR.toFixed(4)});
        acc.r += w * texture2D(uTex, uv + o + split).r;
        acc.g += w * texture2D(uTex, uv + o).g;
        acc.b += w * texture2D(uTex, uv + o - split).b;
        wsum += w;
      }
      col = acc / wsum;
    }
    gl_FragColor = vec4(col, edge * uFade);
  }
`;
