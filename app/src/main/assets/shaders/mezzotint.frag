// @name Mezzotint
// @category Print
// @desc Velvety tones from countless random pits: an old printmaking technique.
// @param uGrain "Grain Size" 1.0 4.0 1.5
// @param uContrastAmt "Contrast" 0.5 2.0 1.0
// @color uInk "Ink" #1A1410
// @color uPaper "Paper" #EFE7D6

vec3 effect(vec2 uv) {
    vec2 p = toPx(uv) / uGrain;
    float t = blurTone(uv, uGrain);
    float dark = clamp((0.5 - t) * uContrastAmt + 0.5, 0.0, 1.0);
    // Random threshold per pit: more pits print where it's darker.
    float n = hash12(floor(p)) * 0.6 + vnoise(p * 0.7) * 0.4;
    float ink = smoothstep(n - 0.05, n + 0.05, dark);
    return mix(uPaper, uInk, ink);
}
