// @name Pastel Wash
// @category Watercolor
// @desc Airy, high-key watercolour in soft pastel tints.
// @param uLight "Lightness" 0.0 1.0 0.5
// @param uSoft "Softness" 2.0 12.0 6.0
// @param uTint "Tint Strength" 0.0 1.0 0.6

vec3 effect(vec2 uv) {
    vec2 p = toPx(uv);
    vec3 c = blur(uv, uSoft);
    vec3 hsv = rgb2hsv(c);
    hsv.y = clamp(hsv.y * (0.6 + uTint), 0.0, 1.0);
    hsv.z = mix(toneLuma(c), 1.0, 0.35 + uLight * 0.35);
    vec3 col = hsv2rgb(hsv);
    float rim = smoothstep(0.05, 0.4, edges(uv, uSoft * 0.5));
    col *= 1.0 - rim * 0.12;
    float grain = paperGrain(p);
    return col * (1.0 - (grain - 0.5) * 0.08);
}
