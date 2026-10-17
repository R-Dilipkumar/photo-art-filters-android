// @name Lithograph
// @category Print
// @desc Greasy crayon drawn on stone and printed: grainy, warm, soft-edged tones.
// @param uGrain "Stone Grain" 0.0 1.0 0.7
// @param uDarkness "Darkness" 0.0 1.0 0.5
// @param uLine "Crayon Lines" 0.0 1.0 0.5
// @color uInk "Ink" #2A1E18
// @color uPaper "Paper" #F0E6D2

vec3 effect(vec2 uv) {
    vec2 p = toPx(uv);
    float dark = pow(1.0 - blurTone(uv, 1.5), mix(1.6, 0.7, uDarkness));
    // The stone's grain decides where the crayon catches.
    float stone = vnoise(p * 0.45) * 0.5 + vnoise(p * 0.12) * 0.3 + hash12(floor(p / 1.5)) * 0.2;
    float t = mix(0.5, stone, uGrain);
    float ink = smoothstep(t - 0.1, t + 0.1, dark);
    float line = smoothstep(0.2, 0.8, edges(uv, 1.2)) * uLine;
    return mix(uPaper, uInk, clamp(max(ink, line), 0.0, 1.0));
}
