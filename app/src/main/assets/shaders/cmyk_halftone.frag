// @name CMYK Halftone
// @category Print
// @desc Four-colour magazine print: cyan, magenta, yellow and black dot screens at their classic angles.
// @param uCell "Dot Spacing" 3.0 14.0 5.0
// @param uBlack "Black Ink" 0.0 1.0 0.8
// @param uMisreg "Misregister" 0.0 3.0 0.5

float screenDot(vec2 uv, float angleDeg, float amount) {
    vec2 p = rot(radians(angleDeg)) * toPx(uv) / uCell;
    return disc(length(fract(p) - 0.5), sqrt(clamp(amount, 0.0, 1.0)) * 0.62);
}

vec3 effect(vec2 uv) {
    vec3 c = blur(uv, uCell * 0.3);
    // RGB -> CMYK with adjustable black generation.
    float k = (1.0 - max(c.r, max(c.g, c.b))) * uBlack;
    vec3 cmy = (1.0 - c - k) / max(1.0 - k, 1e-3);
    vec2 o = px() * uMisreg;
    float dc = screenDot(uv + vec2(o.x, 0.0), 15.0, cmy.x);
    float dm = screenDot(uv - vec2(0.0, o.y), 75.0, cmy.y);
    float dy = screenDot(uv, 0.0, cmy.z);
    float dk = screenDot(uv, 45.0, k);
    vec3 col = vec3(0.98, 0.97, 0.95);
    col *= mix(vec3(1.0), vec3(0.0, 0.68, 0.94), dc);
    col *= mix(vec3(1.0), vec3(0.93, 0.0, 0.55), dm);
    col *= mix(vec3(1.0), vec3(1.0, 0.94, 0.0), dy);
    col *= mix(vec3(1.0), vec3(0.12), dk);
    return col;
}
