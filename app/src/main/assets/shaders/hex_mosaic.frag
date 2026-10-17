// @name Hexagon Mosaic
// @category Mosaic
// @desc Honeycomb tiles, each filled with its area's colour.
// @param uSize "Tile Size" 4.0 40.0 18.0
// @param uGap "Gap" 0.0 0.2 0.05
// @param uBevel "Bevel" 0.0 1.0 0.3

vec3 effect(vec2 uv) {
    vec2 p = toPx(uv) / uSize;
    // Nearest of two offset rectangular grids = hexagonal tiling.
    const vec2 s = vec2(1.0, 1.7320508);
    vec4 hc = floor(vec4(p, p - vec2(0.5, 1.0)) / s.xyxy) + 0.5;
    vec4 h = vec4(p - hc.xy * s, p - (hc.zw + 0.5) * s);
    bool first = dot(h.xy, h.xy) < dot(h.zw, h.zw);
    vec2 local = first ? h.xy : h.zw;
    vec2 center = first ? hc.xy * s : (hc.zw + 0.5) * s;
    vec3 c = srcAt(toUv(center * uSize), uSize * 0.4);
    // Distance from the hexagon's edge (0.5 at the rim).
    vec2 a = abs(local);
    float d = max(dot(a, s * 0.5), a.x);
    float gap = smoothstep(0.5 - uGap - 0.02, 0.5 - uGap, d);
    float bevel = dot(normalize(local + 1e-5), vec2(-0.7, -0.7)) * smoothstep(0.3, 0.5, d) * uBevel * 0.25;
    return mix(c * (1.0 + bevel), vec3(0.08), gap);
}
