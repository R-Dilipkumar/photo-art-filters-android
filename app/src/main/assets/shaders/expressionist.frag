// @name Expressionist
// @category Paint
// @desc Munch-like: wavy, distorted strokes and intense, moody colour.
// @param uWave "Distortion" 0.0 1.0 0.7
// @param uMood "Mood" 0.0 1.0 0.5
// @param uStroke "Stroke Length" 4.0 24.0 12.0

vec3 effect(vec2 uv) {
    vec2 p = toPx(uv);
    vec2 warp = vec2(fbm(p * 0.006), fbm(p * 0.006 + 3.1)) - 0.5;
    vec2 uv2 = uv + warp * px() * 60.0 * uWave;
    // Average along a wavy brush direction.
    float a = fbm(p * 0.004 + 1.7) * TAU * 1.5;
    float spacing = uStroke / 6.0;
    vec2 dir = vec2(cos(a), sin(a)) * px() * spacing;
    vec3 c = vec3(0.0);
    for (int i = -3; i <= 3; i++) {
        c += srcAt(uv2 + dir * float(i), spacing);
    }
    c /= 7.0;
    vec3 hsv = rgb2hsv(c);
    hsv.y = clamp(hsv.y * 1.6 + 0.1, 0.0, 1.0);
    // Mood: shadows sink to deep blue, lights burn orange.
    vec3 moody = mix(vec3(0.1, 0.12, 0.35), vec3(0.95, 0.55, 0.2), smoothstep(0.2, 0.8, toneLuma(c)));
    vec3 col = mix(hsv2rgb(hsv), moody * (0.6 + 0.6 * hsv.z), uMood * 0.6);
    // Visible strokes running along the wave.
    vec2 q = rot(a) * p;
    float stroke = vnoise(vec2(q.x * 0.04, q.y * 0.35));
    return col * (0.8 + 0.4 * stroke);
}
