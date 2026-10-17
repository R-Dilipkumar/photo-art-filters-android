// @name Woodcut
// @category Ink
// @desc Hand-carved woodblock print: bold black with gouged white lines that follow the tones.
// @param uLines "Groove Spacing" 3.0 12.0 5.0
// @param uThreshold "Ink Level" 0.2 0.8 0.5
// @param uWarp "Wood Grain" 0.0 1.0 0.5
// @color uInk "Ink" #15100D
// @color uPaper "Paper" #F2E8D5

vec3 effect(vec2 uv) {
    vec2 p = toPx(uv);
    float warp = (fbm(p * 0.01) - 0.5) * 40.0 * uWarp;
    float y = blurTone(uv, 1.5);
    // Grooves bend with the picture's tones, like a carver following the forms.
    float coord = (p.y + warp + y * 18.0) / uLines;
    float groove = sin(coord * TAU) * 0.5 + 0.5;
    float v = y + (groove - 0.5) * 0.45;
    float aa = fwidth(v) + 1e-3;
    float white = smoothstep(uThreshold - aa, uThreshold + aa, v);
    white *= 1.0 - smoothstep(0.5, 1.2, edges(uv, 1.2));
    return mix(uInk, uPaper, white);
}
