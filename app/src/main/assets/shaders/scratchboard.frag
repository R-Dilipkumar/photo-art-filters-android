// @name Scratchboard
// @category Ink
// @desc White lines scratched out of a black board, bending with the forms.
// @param uSpacing "Line Spacing" 2.5 8.0 4.0
// @param uLight "Brightness" 0.5 2.0 1.0
// @param uFlow "Follow Forms" 0.0 1.0 0.7
// @param uAngle "Angle" 0.0 180.0 20.0

vec3 effect(vec2 uv) {
    vec2 p = toPx(uv);
    float y = clamp(blurTone(uv, 1.5) * uLight, 0.0, 1.0);
    vec2 q = rot(radians(uAngle)) * p;
    // Lines bend with the image's tones so they wrap around shapes.
    float coord = q.y / uSpacing + blurTone(uv, 5.0) * uFlow * 10.0;
    float white = stripe(coord, clamp(y * 0.9, 0.0, 0.9));
    float rim = smoothstep(0.3, 1.0, edges(uv, 1.0)) * 0.6 * y;
    return vec3(clamp(white + rim, 0.0, 1.0)) * vec3(0.98, 0.97, 0.94);
}
