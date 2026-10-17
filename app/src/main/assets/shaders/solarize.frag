// @name Solarize
// @category Film
// @desc The Sabattier darkroom effect: highlights flip to negative, with glowing edges.
// @param uThreshold "Threshold" 0.2 0.9 0.5
// @param uColor "Keep Colour" 0.0 1.0 0.6

vec3 effect(vec2 uv) {
    vec3 c = src(uv);
    // Above the threshold the tone curve turns back down.
    vec3 sol = mix(c, 1.0 - c, step(vec3(uThreshold), c));
    sol = sol / max(uThreshold, 1.0 - uThreshold);
    vec3 grey = vec3(luma(sol));
    return clamp(mix(grey, sol, uColor), 0.0, 1.0);
}
