// @name Thermal Camera
// @category Glitch & Neon
// @desc Heat-vision palette: cold blacks and blues through red and yellow to white-hot.
// @param uSoft "Softness" 0.5 8.0 2.0
// @param uContrastAmt "Contrast" 0.5 2.0 1.2

vec3 heat(float t) {
    vec3 c = mix(vec3(0.0), vec3(0.1, 0.0, 0.5), smoothstep(0.0, 0.2, t));
    c = mix(c, vec3(0.6, 0.0, 0.6), smoothstep(0.2, 0.4, t));
    c = mix(c, vec3(0.95, 0.15, 0.05), smoothstep(0.4, 0.6, t));
    c = mix(c, vec3(1.0, 0.75, 0.0), smoothstep(0.6, 0.8, t));
    return mix(c, vec3(1.0), smoothstep(0.8, 1.0, t));
}

vec3 effect(vec2 uv) {
    float t = clamp((toneLuma(blur(uv, uSoft)) - 0.5) * uContrastAmt + 0.5, 0.0, 1.0);
    return heat(t);
}
