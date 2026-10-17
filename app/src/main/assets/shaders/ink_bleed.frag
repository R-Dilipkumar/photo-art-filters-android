// @name Ink Bleed
// @category Ink
// @desc Ink soaked into blotting paper: organic, feathered edges.
// @param uLevel "Ink Level" 0.2 0.8 0.45
// @param uBleed "Bleed" 0.0 1.0 0.6
// @param uFeather "Feather" 0.0 1.0 0.5
// @color uInk "Ink" #10131C

vec3 effect(vec2 uv) {
    vec2 p = toPx(uv);
    float n = fbm(p * 0.03) - 0.5;
    float fibres = vnoise(p * vec2(0.25, 0.04)) - 0.5;
    float y = blurTone(uv, 2.0) + n * uBleed * 0.35 + fibres * uFeather * 0.12;
    float ink = 1.0 - smoothstep(uLevel - 0.04, uLevel + 0.04, y);
    float halo = (1.0 - smoothstep(uLevel, uLevel + 0.18, y)) * 0.25;
    vec3 paper = vec3(0.97, 0.95, 0.90);
    return mix(paper, uInk, clamp(ink + halo, 0.0, 1.0));
}
