// @name Pixel Art
// @category Mosaic
// @desc Chunky pixels with an optional limited palette and grid lines.
// @param uSize "Pixel Size" 3.0 40.0 14.0
// @param uLevels "Colour Steps" 2.0 32.0 32.0
// @param uGrid "Grid Lines" 0.0 1.0 0.0

vec3 effect(vec2 uv) {
    vec2 p = toPx(uv) / uSize;
    // srcAt at half the pixel size reads the average colour of the block.
    vec3 c = posterize(srcAt(toUv((floor(p) + 0.5) * uSize), uSize * 0.5), uLevels);
    vec2 f = fract(p);
    float edge = min(min(f.x, f.y), min(1.0 - f.x, 1.0 - f.y));
    float grid = (1.0 - smoothstep(0.0, 0.06, edge)) * uGrid;
    return c * (1.0 - grid * 0.5);
}
