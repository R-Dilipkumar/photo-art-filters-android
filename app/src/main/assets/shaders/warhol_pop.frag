// @name Warhol Pop Art
// @category Comic & Pop
// @desc Repeated panels of the photo in bold, clashing screen-print colours.
// @choice uPanels "Panels" "1|4|9" 1
// @param uLevels "Tones" 2.0 4.0 3.0
// @param uLine "Outline" 0.0 1.0 0.5

vec3 palette(int k, int level) {
    // Three inks per panel: dark, mid, light.
    if (k == 0) return level == 0 ? vec3(0.12, 0.1, 0.35) : (level == 1 ? vec3(0.95, 0.25, 0.55) : vec3(1.0, 0.86, 0.1));
    if (k == 1) return level == 0 ? vec3(0.05, 0.25, 0.2) : (level == 1 ? vec3(1.0, 0.5, 0.1) : vec3(0.55, 0.85, 1.0));
    if (k == 2) return level == 0 ? vec3(0.35, 0.05, 0.1) : (level == 1 ? vec3(0.2, 0.75, 0.45) : vec3(1.0, 0.95, 0.6));
    return level == 0 ? vec3(0.1, 0.1, 0.1) : (level == 1 ? vec3(0.3, 0.45, 1.0) : vec3(1.0, 0.6, 0.75));
}

vec3 effect(vec2 uv) {
    float n = uPanels + 1.0;
    vec2 cell = floor(uv * n);
    vec2 local = fract(uv * n);
    float t = toneLuma(blur(local, 2.0 * n));
    float lv = floor(clamp(t, 0.0, 0.999) * uLevels);
    int level = lv < 0.5 ? 0 : (lv >= uLevels - 1.0 ? 2 : 1);
    int k = int(mod(cell.x + cell.y * n + (n > 1.5 ? 0.0 : 1.0), 4.0));
    vec3 col = palette(k, level);
    float line = smoothstep(0.3, 0.8, edges(local, 1.5 * n)) * uLine;
    return mix(col, vec3(0.05), line);
}
