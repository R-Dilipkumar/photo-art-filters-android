// @name Blueprint
// @category Sketch
// @desc Technical drawing in white lines on blueprint paper, with a grid.
// @param uLine "Line Strength" 0.5 4.0 2.0
// @param uGrid "Grid Size" 10.0 80.0 32.0
// @param uFill "Fill" 0.0 0.6 0.15
// @color uPaper "Paper" #1D4E89

vec3 effect(vec2 uv) {
    vec2 p = toPx(uv);
    float line = smoothstep(0.2, 0.7, edges(uv, 1.0) * uLine);
    float major = max(stripe(p.x / uGrid, 0.04), stripe(p.y / uGrid, 0.04));
    float minor = max(stripe(p.x * 5.0 / uGrid, 0.06), stripe(p.y * 5.0 / uGrid, 0.06));
    float grid = major * 0.35 + minor * 0.1;
    float white = clamp(max(line, grid) + blurLuma(uv, 2.0) * uFill, 0.0, 1.0);
    vec3 paper = uPaper * (0.92 + 0.08 * paperGrain(p));
    return mix(paper, vec3(0.93, 0.96, 1.0), white);
}
