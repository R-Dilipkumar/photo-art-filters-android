// @name Van Gogh Swirls
// @category Paint
// @desc Starry-Night style: thick, ridged strokes dragged along swirling paths.
// @param uSwirl "Swirl" 0.0 1.0 0.65
// @param uLength "Stroke Length" 6.0 30.0 18.0
// @param uSize "Swirl Size" 40.0 300.0 110.0
// @param uVivid "Colour" 1.0 2.0 1.5
// @param uRidges "Stroke Ridges" 0.0 1.0 0.7

vec2 strokeDir(vec2 uv) {
    float a = fbm(toPx(uv) / uSize) * TAU * 2.0;
    vec2 d = mix(flow4(uv, 3.0), vec2(cos(a), sin(a)), uSwirl);
    float l = length(d);
    return l > 1e-4 ? d / l : vec2(1.0, 0.0);
}

vec3 effect(vec2 uv) {
    vec2 dir0 = strokeDir(uv);
    float stepPx = uLength / 12.0;
    vec2 posF = uv;
    vec2 posB = uv;
    vec2 prevF = dir0;
    vec2 prevB = -dir0;
    vec3 sum = srcAt(uv, 1.0);
    float total = 1.0;
    // Noise smeared along the same swirl = visible brush strokes (line integral convolution).
    float ridges = vnoise(toPx(uv) * 0.45);
    for (int i = 1; i <= 12; i++) {
        vec2 dF = strokeDir(posF);
        vec2 dB = strokeDir(posB);
        if (dot(dF, prevF) < 0.0) dF = -dF;
        if (dot(dB, prevB) < 0.0) dB = -dB;
        prevF = dF;
        prevB = dB;
        posF += dF * px() * stepPx;
        posB += dB * px() * stepPx;
        float w = 1.0 - float(i) / 13.0;
        sum += (srcAt(posF, stepPx) + srcAt(posB, stepPx)) * w;
        total += 2.0 * w;
        ridges += vnoise(toPx(posF) * 0.45) + vnoise(toPx(posB) * 0.45);
    }
    float r = clamp((ridges / 25.0 - 0.5) * 5.0, -1.0, 1.0);
    vec3 c = adjustSat(sum / total, uVivid);
    // Brighter ridges, darker grooves between strokes.
    return c * (1.0 + r * uRidges * 0.3);
}
