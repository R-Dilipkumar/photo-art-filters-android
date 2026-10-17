// @name Sumi-e Ink Wash
// @category Ink
// @desc Japanese ink wash: soft grey pools, bold strokes, dry-brush streaks on rice paper.
// @param uWash "Wash Softness" 2.0 14.0 6.0
// @param uTones "Ink Tones" 2.0 7.0 4.0
// @param uBleed "Bleed" 0.0 1.0 0.5
// @param uBrush "Dry Brush" 0.0 1.0 0.4

vec3 effect(vec2 uv) {
    vec2 p = toPx(uv);
    // Ink spreads unevenly through the paper fibres.
    vec2 wobble = vec2(fbm(p * 0.02), fbm(p * 0.02 + 7.3)) - 0.5;
    vec2 uv2 = uv + wobble * px() * 24.0 * uBleed;
    float ink = 1.0 - blurTone(uv2, uWash);

    // A few soft-edged ink tones.
    float t = ink * uTones;
    float tone = (floor(t) + smoothstep(0.35, 0.65, fract(t))) / uTones;
    float stroke = smoothstep(0.25, 0.9, edges(uv2, 2.0)) * 0.9;
    tone = max(tone * 0.85, stroke);

    // "Flying white": streaks of bare paper inside dark brush strokes.
    float dry = vnoise(vec2(p.x * 0.012, p.y * 0.25));
    tone *= 1.0 - uBrush * smoothstep(0.55, 0.8, dry) * smoothstep(0.3, 0.8, tone);

    vec3 paper = vec3(0.95, 0.93, 0.87) * (0.97 + 0.03 * fbm(p * 0.05));
    return mix(paper, vec3(0.06, 0.06, 0.07), tone);
}
