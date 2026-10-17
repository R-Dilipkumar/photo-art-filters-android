// @name Emboss
// @category Stylize
// @desc Pressed into metal or paper: shapes raised and lit from one side.
// @param uDepth "Depth" 0.5 6.0 2.5
// @param uLight "Light Angle" 0.0 360.0 135.0
// @param uColor "Keep Colour" 0.0 1.0 0.0

vec3 effect(vec2 uv) {
    vec2 g = gradient(uv, 1.2);
    float a = radians(uLight);
    float v = 0.5 + dot(g, vec2(cos(a), sin(a))) * 0.12 * uDepth;
    vec3 grey = vec3(clamp(v, 0.0, 1.0));
    return mix(grey, overlay(grey, src(uv)), uColor);
}
