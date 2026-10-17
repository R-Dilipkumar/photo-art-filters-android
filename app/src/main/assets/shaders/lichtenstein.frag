// @name Lichtenstein
// @category Comic & Pop
// @desc Roy Lichtenstein pop art: primary colours, big Ben-Day dots, heavy black lines.
// @param uCell "Dot Size" 4.0 14.0 8.0
// @param uLine "Line Weight" 0.5 3.0 1.5
// @param uDots "Dot Areas" 0.0 1.0 0.7

vec3 effect(vec2 uv) {
    vec2 p = toPx(uv);
    vec3 c = adjustSat(bilateral(uv, 4.0, 0.2), 1.6);
    float t = toneLuma(c);
    // Snap to the pop palette: white, yellow, red, blue, peach, black.
    vec3 pal[6] = vec3[6](
        vec3(0.98, 0.97, 0.94), vec3(1.0, 0.85, 0.1), vec3(0.88, 0.12, 0.15),
        vec3(0.1, 0.35, 0.75), vec3(0.98, 0.75, 0.62), vec3(0.06, 0.06, 0.08)
    );
    vec3 probe = mix(c, vec3(t), 0.3);
    int best = 0;
    float bestD = 1e9;
    for (int i = 0; i < 6; i++) {
        vec3 d = pal[i] - probe;
        float dd = dot(d, d);
        if (dd < bestD) { bestD = dd; best = i; }
    }
    vec3 col = pal[best];
    // Coloured mid tones are printed as dots on white.
    vec2 q = rot(radians(30.0)) * p / uCell;
    float dotMask = disc(length(fract(q) - 0.5), 0.36);
    float mid = smoothstep(0.4, 0.5, t) * (1.0 - smoothstep(0.85, 0.95, t));
    if (best != 0 && best != 5) {
        col = mix(col, mix(pal[0], col, dotMask), mid * uDots);
    }
    float line = smoothstep(0.2, 0.55, edges(uv, 1.0 + uLine * 0.6)) ;
    return mix(col, vec3(0.04), clamp(line * uLine, 0.0, 1.0));
}
