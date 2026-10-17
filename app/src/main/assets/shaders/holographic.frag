// @name Holographic
// @category Glitch & Neon
// @desc Iridescent foil: rainbow colours that shift with brightness and position.
// @param uAmount "Shimmer" 0.0 1.0 0.7
// @param uBands "Rainbow Bands" 0.5 6.0 2.0
// @param uLines "Scan Lines" 0.0 1.0 0.3

vec3 effect(vec2 uv) {
    vec2 p = toPx(uv);
    vec3 c = src(uv);
    float t = toneLuma(c);
    float phase = t * uBands + uv.x * 0.6 + uv.y * 0.3 + fbm(p * 0.004) * 0.6;
    vec3 rainbow = 0.5 + 0.5 * cos(TAU * (phase + vec3(0.0, 0.33, 0.67)));
    vec3 col = mix(c, softLight(rainbow, vec3(t)) * 1.2, uAmount);
    col *= 1.0 - uLines * 0.25 * step(0.5, fract(p.y / 4.0));
    return col;
}
