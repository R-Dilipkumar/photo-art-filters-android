// @name XDoG Ink
// @category Ink
// @desc Winnemöller's eXtended Difference-of-Gaussians: crisp ink lines and solid fills.
// @param uSigma "Line Width" 0.5 3.0 1.2
// @param uThreshold "Ink Threshold" 0.3 0.9 0.55
// @param uSharp "Edge Boost" 5.0 40.0 18.0
// @param uHard "Hardness" 2.0 40.0 12.0
// @color uInk "Ink" #111111
// @color uPaper "Paper" #F7F3EA

vec3 effect(vec2 uv) {
    // blur() radius r gives a Gaussian sigma of about 0.61 r.
    float r1 = uSigma / 0.61;
    float g1 = toneLuma(blur(uv, r1));
    float g2 = toneLuma(blur(uv, r1 * 1.6));
    float d = (1.0 + uSharp) * g1 - uSharp * g2;
    // Clamp before tanh: some mobile drivers return NaN for huge inputs.
    float v = d >= uThreshold ? 1.0 : 1.0 + tanh(max(uHard * (d - uThreshold), -10.0));
    return mix(uInk, uPaper, clamp(v, 0.0, 1.0));
}
