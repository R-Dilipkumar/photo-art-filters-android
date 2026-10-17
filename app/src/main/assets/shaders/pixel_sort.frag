// @name Pixel Sort
// @category Glitch & Neon
// @desc Glitch-art streaks: bright runs of pixels pulled downward as if sorted.
// @param uThreshold "Threshold" 0.2 0.9 0.4
// @param uLength "Streak Length" 10.0 200.0 80.0
// @toggle uHorizontal "Horizontal" 0

vec3 effect(vec2 uv) {
    vec2 dir = uHorizontal > 0.5 ? vec2(1.0, 0.0) : vec2(0.0, -1.0);
    vec3 c = src(uv);
    if (toneLuma(c) < uThreshold) return c;
    // Walk back up the streak; brighter samples win, so light runs smear along it.
    vec3 best = c;
    float bestT = toneLuma(c);
    vec3 sum = c;
    float n = 1.0;
    for (int i = 1; i <= 24; i++) {
        vec2 q = uv + dir * px() * uLength * float(i) / 24.0;
        vec3 s = srcAt(q, uLength / 48.0);
        float st = toneLuma(s);
        if (st < uThreshold) break;
        sum += s;
        n += 1.0;
        if (st > bestT) { bestT = st; best = s; }
    }
    // Position along the run blends from the run's average to its brightest.
    return mix(sum / n, best, 0.6);
}
