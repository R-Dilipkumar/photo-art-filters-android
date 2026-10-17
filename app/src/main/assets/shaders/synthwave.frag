// @name Synthwave
// @category Glitch & Neon
// @desc 80s retro-future: deep purple to hot pink and gold, with scanlines and neon edges.
// @param uScan "Scanlines" 0.0 1.0 0.4
// @param uEdge "Neon Edges" 0.0 1.0 0.5
// @param uContrastAmt "Contrast" 0.5 2.0 1.2

vec3 effect(vec2 uv) {
    float t = clamp((toneLuma(blur(uv, 1.0)) - 0.5) * uContrastAmt + 0.5, 0.0, 1.0);
    vec3 col = t < 0.5
        ? mix(vec3(0.08, 0.02, 0.2), vec3(0.85, 0.1, 0.6), t * 2.0)
        : mix(vec3(0.85, 0.1, 0.6), vec3(1.0, 0.82, 0.3), t * 2.0 - 1.0);
    float e = smoothstep(0.15, 0.7, edges(uv, 1.2));
    col += vec3(0.2, 0.9, 1.0) * e * uEdge;
    float row = fract(toPx(uv).y / 3.0);
    col *= 1.0 - uScan * 0.35 * step(0.5, row);
    return col;
}
