// @name Black & White Threshold
// @category Stylize
// @desc Pure two-tone image; "Adaptive" compares each pixel with its surroundings.
// @param uLevel "Threshold" -0.15 0.15 0.0
// @toggle uAdaptive "Adaptive" 1
// @param uRadius "Adaptive Radius" 4.0 40.0 14.0
// @color uDark "Dark" #000000
// @color uLight "Light" #FFFFFF

vec3 effect(vec2 uv) {
    float t = toneLuma(blur(uv, 0.8));
    float ref = uAdaptive > 0.5 ? blurTone(uv, uRadius) - 0.02 : 0.5;
    float aa = 0.015;
    float v = smoothstep(ref + uLevel - aa, ref + uLevel + aa, t);
    return mix(uDark, uLight, v);
}
