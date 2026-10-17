// @name Tilt-Shift
// @category Film
// @desc Makes real scenes look like tiny models: a sharp band, blur above and below, punchy colour.
// @param uCenter "Focus Position" 0.0 1.0 0.6
// @param uBand "Focus Width" 0.02 0.5 0.12
// @param uBlur "Blur" 2.0 30.0 14.0
// @param uVivid "Saturation" 1.0 2.0 1.4

vec3 effect(vec2 uv) {
    float d = abs(uv.y - uCenter);
    float amount = smoothstep(uBand, uBand + 0.25, d);
    vec3 c = mix(src(uv), blur(uv, uBlur * amount + 0.01), smoothstep(0.0, 0.15, amount));
    return adjustSat(sCurve(c, 0.4), uVivid);
}
