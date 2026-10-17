// @name Loose Watercolor
// @category Watercolor
// @desc Loose transparent washes over a faint pencil drawing, with bare paper in the lights.
// @param uBlur "Wash Softness" 2.0 14.0 6.0
// @param uBleed "Bleed" 0.0 1.0 0.6
// @param uPencil "Pencil Lines" 0.0 1.0 0.5
// @param uWhite "Paper Showing" 0.0 1.0 0.3

vec3 effect(vec2 uv) {
    vec2 p = toPx(uv);
    vec2 w = (vec2(fbm(p * 0.015), fbm(p * 0.015 + 5.2)) - 0.5) * 40.0 * uBleed;
    vec2 uv2 = uv + w * px();
    vec3 c = blur(uv2, uBlur);
    float t = toneLuma(c) + (fbm(p * 0.03) - 0.5) * 0.15;
    float paperMask = smoothstep(0.9 - uWhite * 0.45, 0.95 - uWhite * 0.45, t);
    // Dark tide line where each wash dried.
    float rim = smoothstep(0.05, 0.4, edges(uv2, uBlur * 0.6));
    vec3 pigment = adjustSat(c, 1.25) * (1.0 - rim * 0.25);
    vec3 paper = vec3(0.98, 0.97, 0.94);
    float grain = paperGrain(p);
    vec3 col = paper * pigment * (1.0 - (grain - 0.5) * 0.15) / 0.95;
    col = mix(col, paper, paperMask);
    float lines = 1.0 - pow(min(1.0, luma(src(uv)) / max(0.005, blurLuma(uv, 3.0))), 3.0);
    return col * (1.0 - lines * uPencil * 0.6);
}
