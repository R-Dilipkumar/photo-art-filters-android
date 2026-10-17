// @name Pen & Ink Stipple
// @category Ink
// @desc Technical-pen outlines with dotted (stippled) shading.
// @param uDot "Dot Size" 1.5 5.0 2.4
// @param uDensity "Shading" 0.0 1.5 0.9
// @param uLine "Outline" 0.0 2.0 1.0
// @color uInk "Ink" #141414

vec3 effect(vec2 uv) {
    vec2 p = toPx(uv);
    float cell = uDot * 2.2;
    vec2 g = p / cell;
    vec2 base = floor(g);
    float ink = 0.0;
    // Check neighbouring cells too, so dots near a cell border aren't cut off.
    for (int j = -1; j <= 1; j++) {
        for (int i = -1; i <= 1; i++) {
            vec2 c = base + vec2(float(i), float(j));
            vec2 center = c + 0.5 + (hash22(c) - 0.5) * 0.6;
            float dark = 1.0 - toneLuma(srcAt(toUv(center * cell), cell * 0.5));
            float keep = step(hash12(c + 31.7), dark * uDensity);
            float d = length(g - center) * cell;
            ink = max(ink, keep * disc(d, uDot * 0.5));
        }
    }
    float outline = smoothstep(0.15, 0.7, edges(uv, 1.0)) * uLine;
    ink = max(ink, clamp(outline, 0.0, 1.0));
    return mix(vec3(0.98, 0.97, 0.94), uInk, ink);
}
