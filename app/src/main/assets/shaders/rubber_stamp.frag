// @name Rubber Stamp
// @category Print
// @desc Inked rubber stamp: one colour, uneven ink and rough worn edges.
// @param uLevel "Ink Level" 0.3 0.75 0.5
// @param uWear "Wear" 0.0 1.0 0.5
// @color uInk "Ink" #C0262D
// @color uPaper "Paper" #F6F1E7

vec3 effect(vec2 uv) {
    vec2 p = toPx(uv);
    float t = blurTone(uv, 2.0) + (fbm(p * 0.05) - 0.5) * 0.15 * uWear;
    float ink = 1.0 - smoothstep(uLevel - 0.03, uLevel + 0.03, t);
    // Worn patches where the stamp didn't pick up ink.
    float worn = smoothstep(0.55, 0.75, vnoise(p * 0.08) * 0.6 + vnoise(p * 0.5) * 0.4);
    ink *= 1.0 - worn * uWear * 0.8;
    float press = 0.8 + 0.2 * vnoise(p * 0.02);
    return mix(uPaper, uInk, clamp(ink * press, 0.0, 1.0));
}
