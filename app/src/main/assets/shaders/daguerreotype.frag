// @name Daguerreotype
// @category Film
// @desc 1840s silver-plate photograph: cool metallic greys, oval mat, tarnish.
// @param uSheen "Silver Sheen" 0.0 1.0 0.5
// @param uTarnish "Tarnish" 0.0 1.0 0.5
// @param uOval "Oval Frame" 0.0 1.0 0.7

vec3 effect(vec2 uv) {
    vec2 p = toPx(uv);
    float t = toneLuma(blur(uv, 0.8));
    vec3 col = mix(vec3(0.12, 0.13, 0.14), vec3(0.86, 0.88, 0.9), t);
    // Mirror-like sheen across the plate.
    float sheen = smoothstep(0.3, 0.7, 1.0 - abs(uv.x - uv.y));
    col += sheen * uSheen * 0.12 * vec3(0.9, 0.95, 1.0);
    // Tarnish creeping in from the edges.
    vec2 q = (uv - 0.5) * vec2(aspect(), 1.0);
    float rim = smoothstep(0.35, 0.75, length(q) + (fbm(p * 0.02) - 0.5) * 0.2);
    col = mix(col, col * vec3(0.75, 0.6, 0.45), rim * uTarnish);
    // Oval brass mat.
    float oval = length((uv - 0.5) * vec2(1.0, 1.25)) * 2.0;
    float mat = smoothstep(0.92, 0.95, oval) * uOval;
    return mix(col, vec3(0.55, 0.42, 0.2) * (0.8 + 0.2 * vnoise(p * 0.2)), mat);
}
