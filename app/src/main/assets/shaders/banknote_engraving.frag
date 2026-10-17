// @name Banknote Engraving
// @category Ink
// @desc Fine engraved lines that swell in the shadows, like a portrait on a banknote.
// @param uSpacing "Line Spacing" 2.5 8.0 4.0
// @param uCurve "Line Bend" 0.0 30.0 12.0
// @param uAngle "Angle" 0.0 180.0 30.0
// @color uInk "Ink" #1E3B2F
// @color uPaper "Paper" #EFEBDD

vec3 effect(vec2 uv) {
    vec2 p = toPx(uv);
    float y = blurTone(uv, 1.2);
    vec2 q = rot(radians(uAngle)) * p;
    // Lines bend with the tones; their width carries the shading.
    float coord = (q.y + y * uCurve) / uSpacing;
    float ink = stripe(coord, clamp(1.0 - y, 0.0, 1.0) * 0.9);
    vec2 q2 = rot(radians(uAngle + 90.0)) * p;
    float cross = stripe((q2.y - y * uCurve) / uSpacing, clamp(0.55 - y, 0.0, 1.0) * 1.2);
    return mix(uPaper, uInk, max(ink, cross));
}
