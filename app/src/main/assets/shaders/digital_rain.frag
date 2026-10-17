// @name Digital Rain
// @category Glitch & Neon
// @desc Falling green code: columns of glyphs whose brightness traces the photo.
// @param uSize "Glyph Size" 6.0 24.0 14.0
// @param uTrail "Trail Length" 4.0 40.0 14.0
// @param uImage "Image Strength" 0.0 1.0 0.8

vec3 effect(vec2 uv) {
    vec2 p = toPx(uv) / uSize;
    vec2 cell = floor(p);
    vec2 f = fract(p);
    // Each column has its own falling streak, brightest at the head.
    float colSeed = hash12(vec2(cell.x, 9.0));
    float head = fract(colSeed * 7.3) * 60.0;
    float pos = fract((cell.y - head) / uTrail);
    float trail = pow(1.0 - pos, 2.0);
    float t = toneLuma(srcAt(toUv((cell + 0.5) * uSize), uSize * 0.5));
    float bright = mix(trail, trail * 0.4 + t, uImage);
    // A random 5x5 glyph per cell (a 5x5 grid inside a 6x6 cell).
    ivec2 g = ivec2(floor(f * 6.0));
    float on = 0.0;
    if (g.x < 5 && g.y < 5) {
        int bits = int(hash12(cell + 0.37) * 33554431.0);
        on = float((bits >> (g.x + 5 * g.y)) & 1);
    }
    vec3 green = vec3(0.2, 1.0, 0.45);
    vec3 col = green * on * bright * 1.3;
    col += vec3(0.8, 1.0, 0.85) * on * step(0.97, 1.0 - pos) * 0.6;   // white leading glyph
    return col;
}
