// @name Gradient Map
// @category Stylize
// @desc Brightness mapped onto your own three-colour gradient.
// @param uContrastAmt "Contrast" 0.5 2.0 1.1
// @color uShadow "Shadows" #1B1446
// @color uMid "Mid Tones" #E8436B
// @color uHigh "Highlights" #FFE0A3

vec3 effect(vec2 uv) {
    float t = clamp((toneLuma(src(uv)) - 0.5) * uContrastAmt + 0.5, 0.0, 1.0);
    return ramp3(t, uShadow, uMid, uHigh);
}
