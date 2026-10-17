// @name Film Noir
// @category Film
// @desc 1940s detective movie: hard black-and-white, grain, and light through window blinds.
// @param uContrastAmt "Contrast" 1.0 3.0 1.8
// @param uGrain "Grain" 0.0 1.0 0.4
// @param uBlinds "Window Blinds" 0.0 1.0 0.5
// @param uAngle "Blinds Angle" -45.0 45.0 -20.0

vec3 effect(vec2 uv) {
    vec2 p = toPx(uv);
    float t = clamp((toneLuma(src(uv)) - 0.5) * uContrastAmt + 0.5, 0.0, 1.0);
    vec2 q = rot(radians(uAngle)) * p;
    // Soft-edged bands of shadow from the blinds.
    float bands = smoothstep(0.35, 0.65, abs(fract(q.y / 40.0) - 0.5) * 2.0);
    t *= 1.0 - bands * uBlinds * 0.6;
    t += (vnoise(p * 0.8) + hash12(floor(p)) - 1.0) * uGrain * 0.12;
    return vec3(t) * vignette(uv, 0.6);
}
