// @name Etching
// @category Ink
// @desc Fine etched cross-hatching with crisp contours, printed in warm black.
// @param uSpacing "Line Spacing" 2.5 7.0 3.5
// @param uDepth "Depth" 0.0 1.0 0.7
// @param uLine "Contours" 0.0 2.0 1.0
// @color uInk "Ink" #2B1D14
// @color uPaper "Paper" #F1E9D8

vec3 effect(vec2 uv) {
    vec2 p = toPx(uv);
    float dark = (1.0 - blurTone(uv, 1.5)) * (0.5 + uDepth);
    float ink = 0.0;
    for (int i = 0; i < 3; i++) {
        float fi = float(i);
        vec2 q = rot(radians(20.0 + fi * 60.0)) * p;
        float on = smoothstep(0.25 + fi * 0.2, 0.4 + fi * 0.2, dark);
        float w = 0.2 + 0.25 * clamp(dark - fi * 0.2, 0.0, 1.0);
        ink = max(ink, stripe(q.y / uSpacing + vnoise(q * 0.05) * 0.3, w) * on);
    }
    float contour = smoothstep(0.15, 0.6, edges(uv, 1.0)) * uLine;
    return mix(uPaper, uInk, clamp(max(ink, contour), 0.0, 1.0));
}
