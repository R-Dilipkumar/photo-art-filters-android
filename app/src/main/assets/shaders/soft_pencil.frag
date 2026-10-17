// @name Soft Pencil
// @category Sketch
// @desc Pencil outlines with soft diagonal shading strokes.
// @param uRadius "Line Width" 1.0 10.0 4.0
// @param uShading "Shading" 0.0 1.0 0.45
// @param uStroke "Stroke Length" 4.0 40.0 16.0
// @param uAngle "Stroke Angle" 0.0 180.0 45.0

vec3 effect(vec2 uv) {
    vec2 p = toPx(uv);
    float y = luma(src(uv));
    float lines = pow(min(1.0, y / max(0.005, blurLuma(uv, uRadius))), 2.0);

    // Noise stretched along one direction looks like pencil strokes.
    vec2 q = rot(radians(uAngle)) * p;
    float strokes = vnoise(vec2(q.x / uStroke, q.y * 0.35));
    float dark = (1.0 - blurTone(uv, 2.0)) * uShading;
    float shade = clamp(dark * 1.5 - 0.15 - (strokes - 0.5) * 0.6, 0.0, 1.0);

    vec3 paper = vec3(0.97, 0.96, 0.93);
    vec3 graphite = vec3(0.22, 0.22, 0.24);
    vec3 c = mix(paper, graphite, shade * 0.85);
    return c * lines;
}
