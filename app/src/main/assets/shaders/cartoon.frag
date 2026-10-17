// @name Cartoon
// @category Comic & Pop
// @desc Smooth flat cartoon colours with thin dark outlines.
// @param uSmooth "Smoothing" 2.0 10.0 5.0
// @param uLevels "Colour Steps" 3.0 10.0 6.0
// @param uLine "Outline" 0.0 2.0 1.0

vec3 effect(vec2 uv) {
    vec3 c = bilateral(uv, uSmooth, 0.12);
    vec3 hsv = rgb2hsv(c);
    hsv.z = posterize1(hsv.z, uLevels);
    hsv.y = clamp(posterize1(hsv.y, uLevels) * 1.15, 0.0, 1.0);
    vec3 col = hsv2rgb(hsv);
    float line = smoothstep(0.3, 0.75, edges(uv, 1.0)) * uLine;
    return mix(col, col * 0.15, clamp(line, 0.0, 1.0));
}
