// @name Charcoal
// @category Sketch
// @desc Smudgy charcoal on rough paper with deep blacks.
// @param uSmudge "Smudge" 1.0 8.0 3.0
// @param uDarkness "Darkness" 0.0 1.0 0.5
// @param uTooth "Paper Tooth" 0.0 1.0 0.6
// @param uStreaks "Streaks" 0.0 1.0 0.4

vec3 effect(vec2 uv) {
    vec2 p = toPx(uv);
    float y = blurTone(uv, uSmudge);
    float e = smoothstep(0.1, 0.8, edges(uv, 1.5));
    float dark = clamp(pow(1.0 - y, mix(1.8, 0.7, uDarkness)) + e * 0.45, 0.0, 1.0);

    // Charcoal catches on the paper's peaks, so the valleys stay light.
    float tooth = paperGrain(p);
    float streak = vnoise(vec2(p.x * 0.015, p.y * 0.2));
    dark *= 1.0 + (tooth - 0.5) * 1.4 * uTooth + (streak - 0.5) * uStreaks;

    vec3 paper = vec3(0.93, 0.91, 0.87);
    vec3 charcoal = vec3(0.07, 0.07, 0.08);
    return mix(paper, charcoal, clamp(dark, 0.0, 1.0));
}
