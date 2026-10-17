// @name Colored Pencil
// @category Sketch
// @desc Crossing colour strokes on white paper, denser where the photo is dark or vivid.
// @param uRadius "Line Width" 1.0 10.0 3.0
// @param uDensity "Stroke Density" 0.0 1.0 0.6
// @param uAngle "Stroke Angle" 0.0 180.0 35.0
// @param uVivid "Colour" 0.0 2.0 1.4

vec3 effect(vec2 uv) {
    vec2 p = toPx(uv);
    vec3 c = src(uv);
    float y = luma(c);
    float lines = pow(min(1.0, y / max(0.005, blurLuma(uv, uRadius))), 1.5);

    // Long thin noise = pencil strokes (about 2.5 px wide, 25 px long).
    vec2 q1 = rot(radians(uAngle)) * p;
    vec2 q2 = rot(radians(uAngle + 70.0)) * p;
    float s1 = vnoise(vec2(q1.x * 0.04, q1.y * 0.4));
    float s2 = vnoise(vec2(q2.x * 0.04, q2.y * 0.4));
    float stroke = max(s1, s2 * 0.9);

    float tone = blurTone(uv, 1.0);
    float chroma = length(c - vec3(y));
    float pressure = (1.0 - tone) * 0.9 + chroma * 1.2;
    float cover = smoothstep(0.25, 0.75, pressure * (0.5 + uDensity) * (0.35 + stroke));

    vec3 paper = vec3(0.99, 0.98, 0.95);
    vec3 pigment = clamp(adjustSat(c, uVivid) * 1.1, 0.0, 1.0);
    return mix(paper, pigment, cover) * lines;
}
