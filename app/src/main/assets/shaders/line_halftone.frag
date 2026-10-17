// @name Line Halftone
// @category Print
// @desc Straight parallel lines that thicken in the shadows, like a line-screen print.
// @param uSpacing "Line Spacing" 3.0 14.0 5.0
// @param uAngle "Angle" 0.0 180.0 0.0
// @param uWave "Wave" 0.0 1.0 0.0
// @color uInk "Ink" #111111
// @color uPaper "Paper" #F5F1E6

vec3 effect(vec2 uv) {
    vec2 q = rot(radians(uAngle)) * toPx(uv);
    float wave = sin(q.x * 0.05) * uSpacing * uWave;
    float dark = 1.0 - blurTone(uv, uSpacing * 0.3);
    float ink = stripe((q.y + wave) / uSpacing, clamp(dark, 0.02, 0.98));
    return mix(uPaper, uInk, ink);
}
