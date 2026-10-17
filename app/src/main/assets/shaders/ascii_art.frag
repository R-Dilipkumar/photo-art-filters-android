// @name ASCII Art
// @category Mosaic
// @desc The picture typed out in text characters, from " " to "*" by brightness.
// @param uSize "Character Size" 5.0 24.0 11.0
// @choice uStyle "Style" "Paper|Terminal|Colour" 1
// @param uContrastAmt "Contrast" 0.5 2.0 1.2

// 5x5 glyphs as bits (bit = x + 5 * y, y = 0 at the top), sorted by ink coverage.
int glyph(int level) {
    if (level == 0) return 0;          // ' '
    if (level == 1) return 4194304;    // '.'
    if (level == 2) return 131200;     // ':'
    if (level == 3) return 14336;      // '-'
    if (level == 4) return 145536;     // '+'
    if (level == 5) return 459200;     // '='
    if (level == 6) return 27070835;   // '%'
    if (level == 7) return 31520430;   // '@'
    if (level == 8) return 11512810;   // '#'
    return 22511061;                   // '*'
}

vec3 effect(vec2 uv) {
    vec2 p = toPx(uv) / uSize;
    vec2 cell = floor(p);
    vec3 c = srcAt(toUv((cell + 0.5) * uSize), uSize * 0.4);
    float t = clamp((toneLuma(c) - 0.5) * uContrastAmt + 0.5, 0.0, 1.0);
    // On paper, dark areas need dense glyphs; on a screen, bright areas do.
    float coverage = uStyle < 0.5 ? 1.0 - t : t;
    int level = int(clamp(coverage * 10.0, 0.0, 9.0));
    // 6x6 sub-grid per character: 5x5 glyph plus one column/row of spacing.
    ivec2 g = ivec2(floor(fract(p) * 6.0));
    float on = 0.0;
    if (g.x < 5 && g.y < 5) {
        on = float((glyph(level) >> (g.x + 5 * g.y)) & 1);
    }
    if (uStyle < 0.5) return mix(vec3(0.97, 0.96, 0.93), vec3(0.08), on);
    if (uStyle < 1.5) return mix(vec3(0.02, 0.05, 0.03), vec3(0.3, 1.0, 0.45), on);
    return mix(vec3(0.03), adjustSat(c, 1.3) * 1.2, on);
}
