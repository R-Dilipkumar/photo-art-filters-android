// @name Neon Glow
// @category Glitch & Neon
// @desc Glowing neon tubes traced along every edge, on black.
// @param uWidth "Tube Width" 0.5 3.0 1.2
// @param uGlow "Glow" 0.0 1.0 0.6
// @choice uColors "Colours" "Photo|Cyan-Pink|Rainbow" 0

vec3 effect(vec2 uv) {
    float e = smoothstep(0.08, 0.6, edges(uv, uWidth));
    float halo = smoothstep(0.05, 0.6, edges(uv, uWidth * 4.0));
    vec3 hue;
    if (uColors < 0.5) {
        hue = hsv2rgb(vec3(rgb2hsv(blur(uv, 3.0)).x, 0.85, 1.0));
    } else if (uColors < 1.5) {
        hue = mix(vec3(0.1, 0.9, 1.0), vec3(1.0, 0.2, 0.8), uv.x);
    } else {
        hue = hsv2rgb(vec3(fract(uv.x * 0.8 + uv.y * 0.4), 0.85, 1.0));
    }
    vec3 col = hue * (e * 1.2 + halo * uGlow * 0.6);
    return col + vec3(pow(e, 3.0) * 0.5);   // white-hot core
}
