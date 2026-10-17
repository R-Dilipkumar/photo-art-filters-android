// @name Cross Stitch
// @category Mosaic
// @desc Embroidery: a grid of coloured thread crosses on woven fabric.
// @param uSize "Stitch Size" 4.0 24.0 12.0
// @param uLevels "Thread Colours" 3.0 16.0 8.0
// @param uThread "Thread Width" 0.1 0.4 0.22
// @color uFabric "Fabric" #EFE9DC

vec3 effect(vec2 uv) {
    vec2 p = toPx(uv) / uSize;
    vec2 cell = floor(p);
    vec2 f = fract(p);
    vec3 thread = posterize(srcAt(toUv((cell + 0.5) * uSize), uSize * 0.4), uLevels);
    // Two diagonal threads per cell, with a twist texture along each.
    float d1 = abs(f.x - f.y);
    float d2 = abs(f.x + f.y - 1.0);
    float aa = fwidth(d1) + 1e-3;
    float s1 = 1.0 - smoothstep(uThread - aa, uThread + aa, d1);
    float s2 = 1.0 - smoothstep(uThread - aa, uThread + aa, d2);
    float twist1 = 0.85 + 0.15 * sin((f.x + f.y) * 40.0);
    float twist2 = 0.85 + 0.15 * sin((f.x - f.y) * 40.0);
    // Woven fabric: tiny checks.
    vec2 w = toPx(uv) * 0.7;
    vec3 fabric = uFabric * (0.92 + 0.08 * step(0.5, fract(w.x)) * step(0.5, fract(w.y)));
    vec3 col = mix(fabric, thread * twist1, s1);
    col = mix(col, thread * twist2 * 1.05, s2);   // top thread crosses over
    return col;
}
