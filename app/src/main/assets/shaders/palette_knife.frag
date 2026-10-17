// @name Palette Knife
// @category Paint
// @desc Broad flat slabs of paint scraped on with a knife.
// @param uSize "Knife Size" 6.0 20.0 11.0
// @param uStreak "Streaks" 0.0 1.0 0.5
// @param uAngle "Knife Angle" 0.0 180.0 25.0

vec3 effect(vec2 uv) {
    vec2 p = toPx(uv);
    vec2 q = rot(radians(uAngle)) * p;
    // Each slab of paint is a long patch with its own streak pattern.
    vec2 slab = floor(vec2(q.x / (uSize * 2.5), q.y / uSize));
    float jitter = hash12(slab);
    vec3 c = kuwahara(uv, uSize);
    float streak = vnoise(vec2(q.x * 0.02, q.y * 0.4) + jitter * 10.0);
    c *= 0.92 + 0.16 * streak * uStreak;
    float ridge = stripe(q.y / uSize + jitter, 0.08) * 0.15 * uStreak;
    return c * (1.0 - ridge);
}
