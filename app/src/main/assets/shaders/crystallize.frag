// @name Crystallize
// @category Mosaic
// @desc Random polygon cells, each filled with one flat colour.
// @param uSize "Crystal Size" 4.0 60.0 20.0
// @param uJitter "Randomness" 0.0 1.0 1.0
// @param uEdge "Edge Shade" 0.0 1.0 0.2

vec3 effect(vec2 uv) {
    vec2 p = toPx(uv) / uSize;
    vec4 v = voronoi(p, uJitter);
    vec2 seed = v.zw + hash22(v.zw) * uJitter;
    vec3 c = srcAt(toUv(seed * uSize), uSize * 0.35);
    float edge = 1.0 - smoothstep(0.0, 0.08, v.y - v.x);
    return c * (1.0 - edge * uEdge * 0.5);
}
