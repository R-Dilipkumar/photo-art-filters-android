// @name Teletext
// @category Retro
// @desc 1970s TV text-page graphics: eight pure colours in blocky 2x3 mosaics.
// @param uSize "Block Size" 4.0 20.0 8.0
// @param uThreshold "Threshold" 0.2 0.8 0.4

vec3 effect(vec2 uv) {
    // Each character cell holds 2 x 3 blocks with a thin gap between cells.
    vec2 cellSize = vec2(uSize * 2.0, uSize * 3.0);
    vec2 p = toPx(uv);
    vec2 cell = floor(p / cellSize);
    vec2 sub = floor(fract(p / cellSize) * vec2(2.0, 3.0));
    vec2 centre = (cell + (sub + 0.5) / vec2(2.0, 3.0)) * cellSize;
    vec3 c = adjustSat(srcAt(toUv(centre), uSize * 0.5), 1.5);
    vec3 on = step(vec3(uThreshold), c);   // each channel on/off = 8 colours
    vec2 f = fract(p / cellSize);
    float gap = step(0.04, f.x) * step(0.03, f.y);
    return on * gap;
}
