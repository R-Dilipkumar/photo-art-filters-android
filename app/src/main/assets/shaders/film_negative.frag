// @name Film Negative
// @category Film
// @desc An uncut colour negative: inverted tones on the film's orange base.
// @param uMask "Orange Base" 0.0 1.0 0.8
// @param uGrain "Grain" 0.0 1.0 0.3

vec3 effect(vec2 uv) {
    vec2 p = toPx(uv);
    vec3 neg = 1.0 - src(uv);
    vec3 base = mix(vec3(1.0), vec3(0.95, 0.62, 0.38), uMask);
    vec3 col = neg * base;
    col += (vnoise(p * 0.7) - 0.5) * uGrain * 0.1;
    return col;
}
