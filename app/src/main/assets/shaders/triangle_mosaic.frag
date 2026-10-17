// @name Triangle Mosaic
// @category Mosaic
// @desc Regular triangle tiles, each one flat-coloured.
// @param uSize "Triangle Size" 6.0 60.0 26.0
// @param uShade "Facet Shading" 0.0 1.0 0.3

vec3 effect(vec2 uv) {
    vec2 p = toPx(uv) / uSize;
    // Skew so equilateral triangles become half-squares.
    vec2 q = vec2(p.x + p.y * 0.57735, p.y * 1.1547);
    vec2 cell = floor(q);
    vec2 f = fract(q);
    bool upper = f.x > f.y;
    vec2 cq = cell + (upper ? vec2(2.0, 1.0) : vec2(1.0, 2.0)) / 3.0;
    // Back to image space for the centre.
    vec2 cp = vec2(cq.x - cq.y * 0.5, cq.y / 1.1547);
    vec3 c = srcAt(toUv(cp * uSize), uSize * 0.3);
    float facet = (hash12(cell * 2.0 + (upper ? 1.0 : 0.0)) - 0.5) * uShade * 0.3;
    return c * (1.0 + facet);
}
