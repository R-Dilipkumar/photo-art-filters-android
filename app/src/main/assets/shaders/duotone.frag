// @name Duotone
// @category Print
// @desc Two-ink print: shadows in one colour, lights in another.
// @param uContrastAmt "Contrast" 0.5 2.0 1.2
// @param uGrain "Grain" 0.0 1.0 0.2
// @color uDark "Shadow Ink" #1D2B64
// @color uLight "Light Ink" #F8CDDA

vec3 effect(vec2 uv) {
    float t = toneLuma(src(uv));
    t = clamp((t - 0.5) * uContrastAmt + 0.5, 0.0, 1.0);
    t = t * t * (3.0 - 2.0 * t);
    float grain = (vnoise(toPx(uv) * 0.6) - 0.5) * uGrain * 0.15;
    return mix(uDark, uLight, clamp(t + grain, 0.0, 1.0));
}
