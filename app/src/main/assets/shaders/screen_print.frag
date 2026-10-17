// @name Screen Print
// @category Print
// @desc Flat silkscreen inks in a few levels, each colour layer slightly shifted.
// @param uLevels "Ink Levels" 2.0 6.0 3.0
// @param uShift "Layer Shift" 0.0 8.0 3.0
// @param uVivid "Colour" 1.0 2.5 1.6

vec3 effect(vec2 uv) {
    vec2 p = toPx(uv);
    vec2 o = px() * uShift;
    // Each ink layer is printed separately, so each channel lands a little off.
    float r = adjustSat(blur(uv + vec2(o.x, 0.0), 2.0), uVivid).r;
    float g = adjustSat(blur(uv + vec2(-o.x, o.y), 2.0), uVivid).g;
    float b = adjustSat(blur(uv + vec2(0.0, -o.y), 2.0), uVivid).b;
    vec3 c = posterize(clamp(vec3(r, g, b), 0.0, 1.0), uLevels);
    // Ink sits unevenly on the paper.
    float tex = vnoise(p * 0.25) * 0.5 + fbm(p * 0.03) * 0.5;
    return c * (0.93 + 0.1 * tex) + 0.02;
}
