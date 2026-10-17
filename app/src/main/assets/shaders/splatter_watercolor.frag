// @name Splatter Watercolor
// @category Watercolor
// @desc Watercolour wash with flicked paint splatters.
// @param uAmount "Splatter" 0.0 1.0 0.5
// @param uSize "Drop Size" 2.0 14.0 6.0
// @param uWash "Wash Softness" 2.0 12.0 5.0

vec3 effect(vec2 uv) {
    vec2 p = toPx(uv);
    vec3 col = adjustSat(bilateral(uv, uWash, 0.2), 1.2);
    col = mix(col, vec3(1.0), 0.08);
    // Random drops on a coarse grid; each takes a darker, richer version of the colour below.
    float cellPx = uSize * 6.0;
    vec2 g = p / cellPx;
    vec2 base = floor(g);
    for (int j = -1; j <= 1; j++) {
        for (int i = -1; i <= 1; i++) {
            vec2 c = base + vec2(float(i), float(j));
            vec3 h = hash32(c);
            if (h.z > uAmount * 0.6) continue;
            vec2 center = c + h.xy;
            // Drop radius 0.3..1.6 x uSize, as a fraction of the cell.
            float r = (0.3 + 1.3 * hash12(c + 3.7)) * uSize / cellPx;
            float wobble = (vnoise((g - center) * 9.0 + h.xy * 9.0) - 0.5) * r * 0.5;
            float d = length(g - center) + wobble;
            float drop = 1.0 - smoothstep(r * 0.85, r, d);
            float rim = smoothstep(r * 0.6, r, d) * drop;   // pigment gathers at the drop's edge
            vec3 ink = adjustSat(srcAt(toUv(center * cellPx), uSize), 1.6);
            col = mix(col, ink * (0.9 - rim * 0.25), drop * 0.8);
        }
    }
    float grain = paperGrain(p);
    return col * (1.0 - (grain - 0.5) * 0.12);
}
