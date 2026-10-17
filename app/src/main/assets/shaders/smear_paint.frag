// @name Smearing Paint
// @category Paint
// @desc Wet paint smeared along the edges of objects (line integral convolution).
// @param uLength "Smear Length" 4.0 32.0 16.0
// @param uStep "Step Size" 1.0 2.5 1.5
// @param uBristle "Bristles" 0.0 1.0 0.3

vec3 effect(vec2 uv) {
    int steps = int(uLength / uStep);
    float twoSigmaSq = float(steps * steps) * 0.5;
    vec2 dir0 = flow4(uv, 2.0);
    vec2 posF = uv;
    vec2 posB = uv;
    vec2 prevF = dir0;
    vec2 prevB = -dir0;
    vec3 sum = src(uv);
    float total = 1.0;
    // Fine noise smeared along the same path shows the wet streaks.
    float streaks = vnoise(toPx(uv) * 0.5);
    float streakTotal = 1.0;
    for (int i = 1; i <= 24; i++) {
        if (i > steps) break;
        float w = exp(-float(i * i) / twoSigmaSq);
        vec2 dF = flow4(posF, 2.0);
        vec2 dB = flow4(posB, 2.0);
        // t and -t are the same line: keep walking away from the start.
        if (dot(dF, prevF) < 0.0) dF = -dF;
        if (dot(dB, prevB) < 0.0) dB = -dB;
        prevF = dF;
        prevB = dB;
        posF += dF * px() * uStep;
        posB += dB * px() * uStep;
        sum += (srcAt(posF, 1.0) + srcAt(posB, 1.0)) * w;
        total += 2.0 * w;
        streaks += vnoise(toPx(posF) * 0.5) + vnoise(toPx(posB) * 0.5);
        streakTotal += 2.0;
    }
    vec3 c = sum / total;
    float s = clamp((streaks / streakTotal - 0.5) * 5.0, -1.0, 1.0);
    return c * (1.0 + s * uBristle * 0.2);
}
