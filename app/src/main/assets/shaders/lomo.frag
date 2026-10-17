// @name Lomo
// @category Film
// @desc Toy-camera snapshot: heavy vignette, saturated colour, soft corners.
// @param uVignette "Vignette" 0.0 1.0 0.8
// @param uVivid "Saturation" 1.0 2.0 1.5
// @param uSoft "Corner Blur" 0.0 8.0 3.0

vec3 effect(vec2 uv) {
    vec2 q = (uv - 0.5) * vec2(aspect(), 1.0);
    float r = length(q);
    vec3 c = mix(src(uv), blur(uv, uSoft), smoothstep(0.3, 0.8, r));
    c = adjustSat(sCurve(c, 0.6), uVivid);
    c *= vec3(1.0, 1.02, 0.95);
    return c * (1.0 - uVignette * smoothstep(0.2, 0.9, r));
}
