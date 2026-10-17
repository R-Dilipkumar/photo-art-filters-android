// @name Bokeh Blur
// @category Stylize
// @desc Out-of-focus lens blur where bright spots bloom into round discs of light.
// @param uRadius "Blur Size" 4.0 40.0 14.0
// @param uBoost "Highlight Bloom" 0.0 1.0 0.6

vec3 effect(vec2 uv) {
    // Sample a disc on a golden-angle spiral (even coverage with few samples).
    const float GOLDEN = 2.39996323;
    vec3 sum = vec3(0.0);
    float wsum = 0.0;
    float spacing = uRadius / 6.0;
    for (int i = 0; i < 48; i++) {
        float fi = float(i);
        float r = sqrt(fi / 48.0) * uRadius;
        vec2 o = vec2(cos(fi * GOLDEN), sin(fi * GOLDEN)) * r;
        vec3 c = srcAt(uv + toUv(o), spacing);
        // Bright samples count extra, so highlights spread into discs.
        float w = 1.0 + pow(luma(c), 4.0) * 12.0 * uBoost;
        sum += c * w;
        wsum += w;
    }
    return sum / wsum;
}
