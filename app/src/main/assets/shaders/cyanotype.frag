// @name Cyanotype
// @category Film
// @desc Sun-printed Prussian blue photograph on watercolour paper, with brushed edges.
// @param uContrastAmt "Contrast" 0.5 2.0 1.2
// @param uEdges "Brushed Edges" 0.0 1.0 0.5
// @color uBlue "Prussian Blue" #0B2E5C

vec3 effect(vec2 uv) {
    vec2 p = toPx(uv);
    float t = clamp((toneLuma(src(uv)) - 0.5) * uContrastAmt + 0.5, 0.0, 1.0);
    vec3 paper = vec3(0.93, 0.95, 0.97) * (0.97 + 0.03 * paperGrain(p));
    vec3 col = mix(uBlue, paper, t);
    // The coating was brushed on by hand: ragged borders.
    vec2 q = abs(uv - 0.5) * 2.0;
    float edge = max(q.x, q.y) + (fbm(p * 0.03) - 0.5) * 0.12;
    float coated = 1.0 - smoothstep(0.92, 0.95, edge) * uEdges;
    return mix(paper, col, coated);
}
