// @name Wax Crayon
// @category Sketch
// @desc Bold waxy crayon colour that skips over the paper texture.
// @param uLevels "Colours" 3.0 12.0 6.0
// @param uRough "Roughness" 0.0 1.0 0.6
// @param uPressure "Pressure" 0.0 1.0 0.6
// @param uOutline "Outline" 0.0 1.0 0.5

vec3 effect(vec2 uv) {
    vec2 p = toPx(uv);
    vec3 c = posterize(adjustSat(blur(uv, 2.0), 1.3), uLevels);
    float tone = toneLuma(c);
    float tooth = paperGrain(p);
    float strokes = vnoise(rot(0.6) * p * vec2(0.04, 0.3));
    float pressure = uPressure + (1.0 - tone) * 0.5 + length(c - vec3(luma(c))) * 0.6;
    float cover = smoothstep(0.35, 0.65,
        pressure * 0.8 + (tooth - 0.5) * uRough * 1.2 + (strokes - 0.5) * 0.4);
    vec3 paper = vec3(0.98, 0.97, 0.94);
    vec3 col = mix(paper, clamp(c * 1.05, 0.0, 1.0), cover);
    float outline = smoothstep(0.3, 1.0, edges(uv, 1.5)) * uOutline;
    return mix(col, col * 0.35, outline);
}
