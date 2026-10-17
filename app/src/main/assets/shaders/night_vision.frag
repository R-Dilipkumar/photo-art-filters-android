// @name Night Vision
// @category Glitch & Neon
// @desc Green image-intensifier goggles: bright, noisy, with a binocular mask.
// @param uGain "Gain" 0.5 3.0 1.6
// @param uNoise "Noise" 0.0 1.0 0.5
// @toggle uBinocular "Binocular Mask" 1

vec3 effect(vec2 uv) {
    vec2 p = toPx(uv);
    float t = clamp(toneLuma(blur(uv, 1.0)) * uGain, 0.0, 1.0);
    t += (hash12(floor(p)) - 0.5) * uNoise * 0.3;
    t += max(blurLuma(uv, 10.0) - 0.6, 0.0) * uGain;   // bloom around lights
    vec3 col = vec3(0.1, 1.0, 0.25) * t + vec3(0.0, 0.03, 0.0);
    col *= 0.9 + 0.1 * step(0.5, fract(p.y / 3.0));
    if (uBinocular > 0.5) {
        vec2 q = (uv - 0.5) * vec2(aspect(), 1.0);
        float l = length(q - vec2(-0.27, 0.0));
        float r = length(q - vec2(0.27, 0.0));
        col *= 1.0 - smoothstep(0.42, 0.45, min(l, r));
    }
    return col * vignette(uv, 0.4);
}
