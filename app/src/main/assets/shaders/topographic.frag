// @name Topographic Map
// @category Stylize
// @desc Brightness drawn as contour lines, like the height lines on a hiking map.
// @param uLines "Contour Lines" 5.0 40.0 16.0
// @param uSmooth "Smoothing" 1.0 10.0 4.0
// @param uTint "Height Colours" 0.0 1.0 0.6

vec3 effect(vec2 uv) {
    float h = blurTone(uv, uSmooth);
    float minor = stripe(h * uLines, 0.12);
    float major = stripe(h * uLines / 5.0, 0.08);
    // Classic map tints: green lowlands, tan hills, white peaks.
    vec3 land = h < 0.5
        ? mix(vec3(0.55, 0.72, 0.5), vec3(0.88, 0.82, 0.6), h * 2.0)
        : mix(vec3(0.88, 0.82, 0.6), vec3(0.97, 0.96, 0.94), h * 2.0 - 1.0);
    vec3 paper = mix(vec3(0.97, 0.96, 0.92), land, uTint);
    vec3 ink = vec3(0.45, 0.28, 0.15);
    return mix(paper, ink, max(minor * 0.6, major));
}
