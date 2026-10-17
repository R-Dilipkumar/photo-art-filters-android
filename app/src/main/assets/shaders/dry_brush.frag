// @name Dry Brush
// @category Watercolor
// @desc Streaky dry-brush strokes that skip across the paper.
// @param uStreak "Streakiness" 0.0 1.0 0.6
// @param uAngle "Brush Angle" 0.0 180.0 10.0
// @param uSoft "Softness" 1.0 8.0 3.0

vec3 effect(vec2 uv) {
    vec2 p = toPx(uv);
    vec3 c = adjustSat(blur(uv, uSoft), 1.2);
    vec2 q = rot(radians(uAngle)) * p;
    float streak = vnoise(vec2(q.x * 0.012, q.y * 0.35)) * 0.7 + vnoise(vec2(q.x * 0.03, q.y * 0.9)) * 0.3;
    // More paint lands where the photo is dark; the paper shows through elsewhere.
    float load = 1.0 - toneLuma(c) * 0.7;
    float cover = smoothstep(0.35, 0.55, load * (1.0 - uStreak * 0.5) + (streak - 0.5) * uStreak + 0.25);
    vec3 paper = vec3(0.97, 0.96, 0.92);
    return mix(paper, c, cover);
}
