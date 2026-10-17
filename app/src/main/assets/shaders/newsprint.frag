// @name Newsprint
// @category Print
// @desc Coarse halftone on yellowed newspaper with smudgy ink.
// @param uCell "Dot Spacing" 3.0 12.0 5.0
// @param uAge "Paper Age" 0.0 1.0 0.5
// @param uSmudge "Ink Smudge" 0.0 1.0 0.4

vec3 effect(vec2 uv) {
    vec2 p = toPx(uv);
    vec2 q = rot(radians(45.0)) * p / uCell;
    float dark = 1.0 - blurTone(uv, uCell * 0.3);
    float r = sqrt(dark) * 0.62 + (vnoise(p * 0.3) - 0.5) * 0.12 * uSmudge;
    float ink = disc(length(fract(q) - 0.5), r);
    ink = clamp(ink * (0.85 + 0.15 * vnoise(p * 0.08)), 0.0, 1.0);
    vec3 paper = mix(vec3(0.95, 0.94, 0.9), vec3(0.88, 0.82, 0.66), uAge);
    paper *= 0.95 + 0.05 * fbm(p * 0.02);
    return mix(paper, vec3(0.13, 0.12, 0.12), ink * 0.92);
}
