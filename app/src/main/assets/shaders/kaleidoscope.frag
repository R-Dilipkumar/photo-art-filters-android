// @name Kaleidoscope
// @category Distort
// @desc Mirror segments around the centre, like looking down a kaleidoscope.
// @param uSegments "Segments" 3.0 16.0 8.0
// @param uRotate "Rotation" 0.0 360.0 0.0
// @param uZoom "Zoom" 0.3 2.0 1.0

vec3 effect(vec2 uv) {
    vec2 q = (uv - 0.5) * vec2(aspect(), 1.0);
    float r = length(q) / uZoom;
    float a = atan(q.y, q.x) + radians(uRotate);
    float seg = TAU / floor(uSegments);
    a = mod(a, seg);
    a = abs(a - seg * 0.5);   // mirror inside each segment
    vec2 s = vec2(cos(a), sin(a)) * r;
    vec2 suv = s / vec2(aspect(), 1.0) + 0.5;
    // Fold anything outside the picture back in.
    suv = abs(mod(suv - 1.0, 2.0) - 1.0);
    return src(suv);
}
