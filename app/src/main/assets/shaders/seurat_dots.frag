// @name Seurat Dots
// @category Paint
// @desc Divisionism: tiny overlapping dots of pure, jittered hues that mix in the eye.
// @param uDot "Dot Size" 2.0 6.0 3.0
// @param uHueJitter "Hue Jitter" 0.0 0.2 0.08
// @param uVivid "Saturation" 0.8 2.0 1.4

vec3 effect(vec2 uv) {
    vec2 p = toPx(uv) / uDot;
    vec2 cell = floor(p);
    vec3 col = adjustSat(blur(uv, uDot * 2.0), 0.6) * 0.9 + 0.08;   // light ground
    float best = -1.0;
    for (int y = -1; y <= 1; y++) {
        for (int x = -1; x <= 1; x++) {
            vec2 g = cell + vec2(float(x), float(y));
            vec3 h = hash32(g);
            vec2 center = g + 0.5 + (h.xy - 0.5) * 0.8;
            float r = 0.55 + 0.2 * h.z;
            if (length(p - center) < r && h.z > best) {
                best = h.z;
                vec3 hsv = rgb2hsv(srcAt(toUv(center * uDot), uDot * 0.5));
                hsv.x = fract(hsv.x + (h.x - 0.5) * 2.0 * uHueJitter);
                hsv.y = clamp(hsv.y * uVivid + 0.1, 0.0, 1.0);
                hsv.z = clamp(hsv.z * (0.9 + 0.25 * h.y), 0.0, 1.0);
                col = hsv2rgb(hsv);
            }
        }
    }
    return col;
}
