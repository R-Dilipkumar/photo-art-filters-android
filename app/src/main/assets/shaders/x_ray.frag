// @name X-Ray
// @category Glitch & Neon
// @desc Inverted, glowing blue-white like a radiograph.
// @param uGlow "Edge Glow" 0.0 1.0 0.6
// @param uContrastAmt "Contrast" 0.5 2.0 1.3

vec3 effect(vec2 uv) {
    float t = 1.0 - toneLuma(blur(uv, 1.0));
    t = clamp((t - 0.5) * uContrastAmt + 0.5, 0.0, 1.0);
    float e = smoothstep(0.1, 0.7, edges(uv, 1.5));
    vec3 col = mix(vec3(0.0, 0.02, 0.06), vec3(0.75, 0.9, 1.0), t);
    return col + vec3(0.5, 0.8, 1.0) * e * uGlow * 0.5;
}
