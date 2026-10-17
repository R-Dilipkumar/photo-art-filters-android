// @name Tiny Planet
// @category Distort
// @desc Wraps the photo into a little round world: the ground curls into a planet.
// @param uZoom "Planet Size" 0.3 1.5 0.8
// @param uRotate "Rotation" 0.0 360.0 0.0
// @toggle uInvert "Tunnel (Inside Out)" 0

vec3 effect(vec2 uv) {
    vec2 q = (uv - 0.5) * vec2(aspect(), 1.0);
    float r = length(q) / (0.5 * uZoom);
    float a = atan(q.x, q.y) + radians(uRotate);
    // Angle -> horizontal position; distance -> vertical (bottom of photo at the centre).
    // The photo runs out and back (mirrored), so its two ends meet without a seam.
    float x = 1.0 - abs(2.0 * fract(a / TAU + 0.5) - 1.0);
    float y = uInvert > 0.5 ? clamp(r * 0.5, 0.0, 1.0) : clamp(1.0 - r * 0.5, 0.0, 1.0);
    // Wider footprint near the centre: pick a blurrier mip there.
    return srcAt(vec2(x, y), 1.0 + 4.0 * (1.0 - min(r, 1.0)));
}
