// @name Frosted Glass
// @category Distort
// @desc Seen through a frosted bathroom window: grainy scattering and soft shapes.
// @param uAmount "Frost" 0.0 20.0 8.0
// @param uGrain "Grain Size" 1.0 6.0 2.0

vec3 effect(vec2 uv) {
    vec2 p = toPx(uv);
    vec2 jitter = (hash22(floor(p / uGrain)) - 0.5) * 2.0 * uAmount;
    vec3 c = srcAt(uv + toUv(jitter), uAmount * 0.25);
    return mix(c, vec3(0.92, 0.95, 0.97), 0.08);
}
