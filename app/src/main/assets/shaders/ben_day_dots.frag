// @name Ben-Day Dots
// @category Print
// @desc Old comic printing: flat colours made of evenly spaced dots, with black key lines.
// @param uCell "Dot Spacing" 3.0 12.0 6.0
// @param uLevels "Colour Steps" 2.0 5.0 3.0
// @param uLine "Key Lines" 0.0 1.0 0.8

vec3 effect(vec2 uv) {
    vec2 p = toPx(uv);
    vec3 c = posterize(adjustSat(bilateral(uv, 4.0, 0.2), 1.5), uLevels);
    float t = toneLuma(c);
    // Mid tones become dots of the colour on white; deep and light areas stay solid.
    vec2 q = rot(radians(22.0)) * p / uCell;
    float dotMask = disc(length(fract(q) - 0.5), 0.33);
    float useDots = smoothstep(0.35, 0.45, t) * (1.0 - smoothstep(0.85, 0.95, t));
    vec3 col = mix(c, mix(vec3(0.98), c * 0.9, dotMask), useDots);
    float line = smoothstep(0.25, 0.7, edges(uv, 1.5)) * uLine;
    return mix(col, vec3(0.05), line);
}
