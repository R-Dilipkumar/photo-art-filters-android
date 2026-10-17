// @name Halftone
// @category Print
// @desc Classic dot screen: dots grow in the shadows until they merge.
// @param uCell "Dot Spacing" 3.0 16.0 6.0
// @param uAngle "Screen Angle" 0.0 90.0 45.0
// @color uInk "Ink" #111111
// @color uPaper "Paper" #F5F1E6

vec3 effect(vec2 uv) {
    vec2 p = rot(radians(uAngle)) * toPx(uv) / uCell;
    float dark = 1.0 - blurTone(uv, uCell * 0.3);
    // Dot area matches the darkness; dots touch at about 78% ink.
    float r = sqrt(dark) * 0.62;
    float ink = disc(length(fract(p) - 0.5), r);
    return mix(uPaper, uInk, ink);
}
