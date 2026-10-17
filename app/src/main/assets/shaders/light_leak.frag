// @name Light Leak
// @category Film
// @desc Warm red-orange light leaking into the camera from one edge.
// @param uAmount "Leak Strength" 0.0 1.0 0.6
// @param uSide "Leak Position" 0.0 360.0 30.0
// @param uWarm "Warm Grade" 0.0 1.0 0.4

vec3 effect(vec2 uv) {
    vec2 p = toPx(uv);
    vec3 c = src(uv);
    c = mix(c, c * vec3(1.05, 1.0, 0.9), uWarm);
    float a = radians(uSide);
    vec2 dir = vec2(cos(a), sin(a));
    // Distance into the frame from the leaking edge, wobbled by smooth noise.
    float d = dot(uv - 0.5, dir) + 0.5 + (fbm(p * 0.004) - 0.5) * 0.3;
    float leak = smoothstep(0.35, 1.0, d) * uAmount;
    vec3 tint = mix(vec3(1.0, 0.75, 0.3), vec3(1.0, 0.25, 0.15), smoothstep(0.6, 1.0, d));
    return screen(c, tint * leak);
}
