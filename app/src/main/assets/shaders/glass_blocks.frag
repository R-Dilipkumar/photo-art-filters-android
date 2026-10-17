// @name Glass Blocks
// @category Distort
// @desc A wall of glass bricks: each block bends the view like a little lens.
// @param uSize "Block Size" 20.0 160.0 60.0
// @param uRefract "Refraction" 0.0 1.0 0.5
// @param uEdge "Edge Shine" 0.0 1.0 0.5

vec3 effect(vec2 uv) {
    vec2 p = toPx(uv) / uSize;
    vec2 f = fract(p) - 0.5;
    // Each block flips and magnifies what's behind it.
    vec2 offset = -f * uSize * uRefract * 0.8;
    vec3 c = src(uv + toUv(offset));
    vec2 a = abs(f);
    float edge = smoothstep(0.38, 0.5, max(a.x, a.y));
    float light = dot(normalize(f + 1e-4), vec2(-0.7, -0.7));
    c *= 1.0 + edge * light * 0.3 * uEdge;
    return mix(c, vec3(0.85, 0.9, 0.92), edge * 0.25 * uEdge);
}
