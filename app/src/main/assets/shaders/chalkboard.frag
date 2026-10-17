// @name Chalkboard
// @category Sketch
// @desc White chalk drawing on a dark school board.
// @param uLine "Line Strength" 0.5 4.0 1.6
// @param uFill "Shading" 0.0 1.0 0.35
// @param uDust "Chalk Dust" 0.0 1.0 0.5
// @color uBoard "Board" #22302A

vec3 effect(vec2 uv) {
    vec2 p = toPx(uv);
    float line = smoothstep(0.15, 0.8, edges(uv, 1.2) * uLine);
    float fill = blurLuma(uv, 2.0) * uFill;
    float grain = paperGrain(p * 1.3);
    float chalk = max(line, fill) * smoothstep(0.2, 0.7, grain + 0.25);
    vec3 board = uBoard + (fbm(p * 0.01) - 0.5) * uDust * 0.12 + uDust * 0.04;
    return mix(board, vec3(0.92, 0.93, 0.90), clamp(chalk, 0.0, 1.0));
}
