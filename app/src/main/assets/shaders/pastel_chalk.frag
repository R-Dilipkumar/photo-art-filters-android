// @name Pastel Chalk
// @category Sketch
// @desc Soft chalk pastel on tinted paper; the paper shows through the grain.
// @param uSoft "Softness" 1.0 8.0 3.0
// @param uCover "Coverage" 0.0 1.0 0.6
// @param uTooth "Paper Tooth" 0.0 1.0 0.6
// @color uPaper "Paper" #3B3A45

vec3 effect(vec2 uv) {
    vec2 p = toPx(uv);
    vec3 c = blur(uv, uSoft);
    float lift = 0.5 - avgLuma();
    vec3 pastel = clamp(mix(c, vec3(1.0), 0.12) * (1.1 + max(lift, 0.0)), 0.0, 1.0);

    // Short strokes, each patch of the picture in its own direction.
    vec2 cell = floor(p / 22.0);
    float angle = hash12(cell) * PI;
    float stroke = vnoise(rot(angle) * p * vec2(0.035, 0.28));
    float tooth = paperGrain(p);

    float cover = smoothstep(0.3, 0.7,
        uCover + (tooth - 0.5) * uTooth + (stroke - 0.5) * 0.5 + (toneLuma(c) - 0.5) * 0.3);
    return mix(uPaper, pastel, cover);
}
