// @name Colour Dither
// @category Retro
// @desc Few colours, lots of pattern: per-channel ordered (Bayer) dithering.
// @param uSize "Pixel Size" 1.0 8.0 2.0
// @param uLevels "Levels per Channel" 2.0 8.0 3.0
// @choice uMatrix "Pattern" "2x2|4x4|8x8" 2

vec3 effect(vec2 uv) {
    vec2 cellP = floor(toPx(uv) / uSize);
    vec3 c = srcAt(toUv((cellP + 0.5) * uSize), uSize * 0.5);
    float b = uMatrix < 0.5 ? bayer2(cellP) : (uMatrix < 1.5 ? bayer4(cellP) : bayer8(cellP));
    float n = uLevels - 1.0;
    return clamp(floor(c * n + b) / n, 0.0, 1.0);
}
