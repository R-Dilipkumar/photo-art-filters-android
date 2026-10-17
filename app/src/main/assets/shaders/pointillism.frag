// @name Pointillism
// @category Paint
// @desc Round paint dots on canvas, bigger in the shadows.
// @param uCell "Dot Spacing" 3.0 12.0 6.0
// @param uMaxRad "Dot Size" 0.45 0.85 0.65
// @param uLevels "Palette Steps" 4.0 16.0 10.0

vec3 effect(vec2 uv) {
    vec2 p = toPx(uv) / uCell;          // position in cell units
    vec2 cell = floor(p);
    vec3 col = vec3(0.95, 0.93, 0.88);
    // Check the 3x3 neighbour cells so dots can cross cell borders.
    for (int y = -1; y <= 1; y++) {
        for (int x = -1; x <= 1; x++) {
            vec2 g = cell + vec2(float(x), float(y));
            vec2 jitter = vec2(hash12(g), hash12(g + 17.3)) - 0.5;
            vec2 center = g + 0.5 + jitter * 0.4;
            vec3 paint = srcAt(toUv(center * uCell), uCell * 0.5);
            paint = posterize(paint, uLevels);
            float radius = mix(uMaxRad, uMaxRad * 0.4, toneLuma(paint));
            float mask = disc(length(p - center), radius);
            col = mix(col, paint, mask);
        }
    }
    return col;
}
