// @name Cross Process
// @category Film
// @desc Slide film developed in the wrong chemicals: punchy, yellow-green highlights, cyan shadows.
// @param uAmount "Strength" 0.0 1.0 0.8
// @param uVivid "Saturation" 0.8 2.0 1.3

vec3 effect(vec2 uv) {
    vec3 c = src(uv);
    vec3 x;
    x.r = smoothstep(0.05, 0.95, c.r);
    x.g = clamp(smoothstep(-0.05, 1.0, c.g) * 1.05, 0.0, 1.0);
    x.b = c.b * 0.65 + 0.18;
    return mix(c, adjustSat(x, uVivid), uAmount);
}
