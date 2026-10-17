// @name Toy Bricks
// @category Mosaic
// @desc The photo built from plastic toy bricks, studs and all.
// @param uSize "Brick Size" 6.0 40.0 20.0
// @param uLevels "Colour Steps" 3.0 12.0 6.0

vec3 effect(vec2 uv) {
    vec2 p = toPx(uv) / uSize;
    vec2 cell = floor(p);
    vec2 f = fract(p) - 0.5;
    vec3 c = posterize(adjustSat(srcAt(toUv((cell + 0.5) * uSize), uSize * 0.4), 1.3), uLevels);
    vec2 light = normalize(vec2(-1.0, -1.0));
    // Brick edges: lit top-left, shaded bottom-right.
    vec2 a = abs(f);
    float rim = smoothstep(0.42, 0.5, max(a.x, a.y));
    float rimLight = dot(sign(f) * step(a.yx, a), light);
    vec3 col = c * (1.0 + rim * rimLight * 0.3);
    // The round stud on top, with a drop shadow and a highlight.
    float d = length(f);
    float shadow = disc(length(f - vec2(0.05)), 0.3) * 0.25;
    float stud = disc(d, 0.28);
    float studLight = dot(normalize(f + 1e-5), light) * smoothstep(0.18, 0.28, d);
    col *= 1.0 - shadow * (1.0 - stud);
    col = mix(col, c * (1.05 + studLight * 0.35), stud);
    return col;
}
