// @name Glitch
// @category Glitch & Neon
// @desc Corrupted digital video: shifted slices, swapped colour channels, broken blocks.
// @param uAmount "Glitch Amount" 0.0 1.0 0.5
// @param uBlock "Slice Height" 4.0 60.0 16.0
// @param uSeed "Randomise" 0.0 100.0 7.0

vec3 effect(vec2 uv) {
    vec2 p = toPx(uv);
    vec2 slice = floor(p / vec2(uBlock * 6.0, uBlock));
    float h = hash12(slice + floor(uSeed));
    float row = hash12(vec2(slice.y, floor(uSeed) + 3.0));
    vec2 uv2 = uv;
    // Whole rows slide sideways.
    if (row < uAmount * 0.35) uv2.x += (hash12(vec2(slice.y, floor(uSeed))) - 0.5) * 0.25;
    float split = step(row, uAmount * 0.35) * 8.0;
    vec3 c = vec3(src(uv2 + vec2(split, 0.0) * px()).r, src(uv2).g, src(uv2 - vec2(split, 0.0) * px()).b);
    if (h < uAmount * 0.12) c = c.gbr;                          // channel swap
    if (h > 1.0 - uAmount * 0.06) c = vec3(1.0) - c;            // inverted block
    if (abs(h - 0.5) < uAmount * 0.03) c = posterize(c, 2.0);   // crushed block
    // Thin bright scanline tears.
    float tear = step(0.995 - uAmount * 0.01, hash12(vec2(floor(p.y), floor(uSeed))));
    return mix(c, vec3(1.0), tear * 0.6);
}
