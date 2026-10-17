// @name Urban Sketch
// @category Watercolor
// @desc Pen outlines with quick, loose watercolour washes, like a travel sketchbook.
// @param uLine "Pen Lines" 0.0 2.0 1.0
// @param uWash "Wash Amount" 0.0 1.0 0.7
// @param uOffset "Wash Offset" 0.0 10.0 4.0

vec3 effect(vec2 uv) {
    vec2 p = toPx(uv);
    // Washes are dabbed on quickly: shifted, blurred, and they skip some areas.
    vec2 shift = (vec2(vnoise(p * 0.01), vnoise(p * 0.01 + 4.0)) - 0.5) * 2.0 * uOffset;
    vec3 wash = adjustSat(blur(uv + shift * px(), 5.0), 1.3);
    float skip = smoothstep(0.35, 0.6, fbm(p * 0.008) + (1.0 - toneLuma(wash)) * 0.4);
    vec3 paper = vec3(0.98, 0.97, 0.94);
    vec3 col = mix(paper, paper * wash / 0.95, skip * uWash);
    float rim = smoothstep(0.1, 0.5, edges(uv + shift * px(), 3.0)) * skip;
    col *= 1.0 - rim * 0.15;
    float y = luma(src(uv));
    float lines = 1.0 - pow(min(1.0, y / max(0.005, blurLuma(uv, 2.5))), 4.0);
    lines = max(lines, smoothstep(0.25, 0.8, edges(uv, 1.0)) * 0.8);
    return mix(col, vec3(0.12, 0.11, 0.1), clamp(lines * uLine, 0.0, 1.0));
}
