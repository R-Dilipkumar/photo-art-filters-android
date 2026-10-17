// @name Bleach Bypass
// @category Film
// @desc Skipped bleach in the lab: silver stays in the print, giving gritty, low-colour contrast.
// @param uAmount "Strength" 0.0 1.0 0.7

vec3 effect(vec2 uv) {
    vec3 c = src(uv);
    vec3 grey = vec3(luma(c));
    // Overlay the black-and-white silver image on the colour image.
    vec3 bypass = overlay(grey, c);
    bypass = mix(bypass, grey, 0.4);
    return mix(c, sCurve(bypass, 0.5), uAmount);
}
