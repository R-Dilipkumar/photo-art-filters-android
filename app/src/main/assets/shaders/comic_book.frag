// @name Comic Book
// @category Comic & Pop
// @desc Inked outlines, flat colours and halftone shadows, like a printed comic.
// @param uLevels "Tone Steps" 2.0 8.0 4.0
// @param uLine "Ink Lines" 0.0 2.0 1.0
// @param uDots "Halftone Shadows" 0.0 1.0 0.7
// @param uCell "Dot Size" 3.0 10.0 5.0

vec3 effect(vec2 uv) {
    vec2 p = toPx(uv);
    vec3 c = bilateral(uv, 4.0, 0.15);
    float t = toneLuma(c);
    vec3 hsv = rgb2hsv(c);
    hsv.y = clamp(hsv.y * 1.4, 0.0, 1.0);
    hsv.z = posterize1(t, uLevels) * 0.85 + 0.15;
    vec3 col = hsv2rgb(hsv);
    // Halftone dots darken the shadows.
    vec2 q = rot(radians(45.0)) * p / uCell;
    float r = sqrt(clamp(0.65 - t, 0.0, 1.0)) * 0.75;
    col *= 1.0 - disc(length(fract(q) - 0.5), r) * uDots * 0.6;
    float line = smoothstep(0.2, 0.6, edges(uv, 1.2)) * uLine;
    return mix(col, vec3(0.04), clamp(line, 0.0, 1.0));
}
