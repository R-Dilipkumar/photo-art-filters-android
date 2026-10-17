// @name Instant Photo
// @category Film
// @desc Instant-camera print: soft faded colour, cyan shadows, white frame with a wide bottom.
// @param uFade "Fade" 0.0 1.0 0.5
// @param uWarm "Warm Highlights" 0.0 1.0 0.5
// @toggle uFrame "Show Frame" 1

vec3 effect(vec2 uv) {
    vec2 inner = uv;
    if (uFrame > 0.5) {
        // Picture area inside the frame: thin sides and top, thick bottom.
        vec2 lo = vec2(0.05, 0.05 * aspect());
        vec2 hi = vec2(0.95, 1.0 - 0.2 * aspect() * 0.75);
        if (uv.x < lo.x || uv.x > hi.x || uv.y < lo.y || uv.y > hi.y) {
            return vec3(0.96, 0.95, 0.92) * (0.98 + 0.02 * vnoise(toPx(uv) * 0.2));
        }
        inner = (uv - lo) / (hi - lo);
        // Crop (don't stretch) the photo to the frame's window shape.
        float s = (hi.y - lo.y) / (hi.x - lo.x);
        vec2 window = s <= 1.0 ? vec2(1.0, s) : vec2(1.0 / s, 1.0);
        inner = 0.5 + (inner - 0.5) * window;
    }
    vec3 c = blur(inner, 0.8);
    float y = luma(c);
    c = mix(c, c + vec3(-0.04, 0.03, 0.08), (1.0 - y) * uFade);      // cyan shadows
    c = mix(c, c * vec3(1.06, 1.0, 0.88), y * uWarm);                 // warm highlights
    c = mix(c, c * 0.85 + 0.12, uFade * 0.6);
    return adjustSat(c, 0.9) * vignette(inner, 0.25);
}
