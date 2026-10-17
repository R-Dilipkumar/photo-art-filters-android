// @name Knitted Sweater
// @category Mosaic
// @desc The picture knitted into a woolly jumper: rows of V-shaped stitches.
// @param uSize "Stitch Size" 5.0 30.0 14.0
// @param uLevels "Yarn Colours" 3.0 12.0 6.0
// @param uFuzz "Fuzz" 0.0 1.0 0.5

vec3 effect(vec2 uv) {
    vec2 p = toPx(uv) / vec2(uSize, uSize * 1.25);
    vec2 cell = floor(p);
    vec2 f = fract(p);
    vec3 yarn = posterize(adjustSat(srcAt(toUv((cell + 0.5) * vec2(uSize, uSize * 1.25)), uSize * 0.4), 1.2), uLevels);
    // Each stitch = two leaning loops forming a V.
    vec2 l = vec2((f.x - 0.25) * 2.0 + (f.y - 0.5) * 0.9, f.y - 0.5);
    vec2 r = vec2((f.x - 0.75) * 2.0 - (f.y - 0.5) * 0.9, f.y - 0.5);
    float loopL = 1.0 - smoothstep(0.35, 0.6, length(l * vec2(1.0, 0.85)));
    float loopR = 1.0 - smoothstep(0.35, 0.6, length(r * vec2(1.0, 0.85)));
    float loops = max(loopL, loopR);
    float strands = 0.85 + 0.15 * sin((f.y + f.x * 0.3) * 30.0);
    float fuzz = (vnoise(toPx(uv) * 0.6) - 0.5) * uFuzz * 0.25;
    return yarn * (0.35 + 0.75 * loops) * strands + fuzz;
}
