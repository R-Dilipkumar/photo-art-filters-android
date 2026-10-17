// @name Technicolor
// @category Film
// @desc Classic Hollywood colour: rich two-strip red/cyan or saturated three-strip.
// @choice uProcess "Process" "Two-strip|Three-strip" 0
// @param uAmount "Strength" 0.0 1.0 0.85

vec3 effect(vec2 uv) {
    vec3 c = src(uv);
    vec3 t;
    if (uProcess < 0.5) {
        // Only red and cyan records: greens and blues share one channel.
        float cyan = (c.g + c.b) * 0.5;
        t = sCurve(vec3(c.r, cyan, cyan * 1.02), 0.4);
    } else {
        // Each channel loses the others' crosstalk, then gets a strong curve.
        vec3 sep = vec3(c.r - (c.g + c.b) * 0.5, c.g - (c.r + c.b) * 0.5, c.b - (c.r + c.g) * 0.5);
        t = sCurve(clamp(c + sep * 0.5, 0.0, 1.0), 0.5);
    }
    return mix(c, t, uAmount);
}
