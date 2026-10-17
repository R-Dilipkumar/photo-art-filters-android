// @name Stained Glass
// @category Mosaic
// @desc Voronoi glass pieces joined by dark lead lines, glowing as if lit from behind.
// @param uSize "Piece Size" 8.0 60.0 22.0
// @param uLead "Lead Width" 0.02 0.25 0.08
// @param uGlow "Glow" 0.0 1.0 0.5
// @param uVivid "Colour" 1.0 2.5 1.6

vec3 effect(vec2 uv) {
    vec2 p = toPx(uv) / uSize;
    vec4 v = voronoi(p, 1.0);
    vec2 seed = v.zw + hash22(v.zw);
    vec3 glass = adjustSat(srcAt(toUv(seed * uSize), uSize * 0.3), uVivid);
    // Brighter in the middle of each piece, with a little ripple in the glass.
    float inner = 1.0 - smoothstep(0.0, 0.9, v.x);
    float ripple = vnoise(toPx(uv) * 0.08) - 0.5;
    glass *= 0.75 + uGlow * 0.5 * inner + ripple * 0.12;
    float lead = 1.0 - smoothstep(uLead, uLead + 0.03, v.y - v.x);
    return mix(clamp(glass, 0.0, 1.0), vec3(0.05, 0.05, 0.06), lead);
}
