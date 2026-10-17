// @name Vector Illustration
// @category Comic & Pop
// @desc Clean flat shapes like an auto-traced vector graphic.
// @param uSmooth "Simplify" 2.0 12.0 7.0
// @param uLevels "Shades" 3.0 8.0 5.0
// @param uOutline "Shape Edges" 0.0 1.0 0.3

vec3 effect(vec2 uv) {
    vec3 c = kuwahara8(uv, uSmooth, 12.0, vec2(1.0, 0.0), vec2(0.0, 1.0));
    vec3 hsv = rgb2hsv(c);
    hsv.z = posterize1(hsv.z, uLevels);
    hsv.y = posterize1(hsv.y, uLevels);
    hsv.x = posterize1(hsv.x, 24.0);
    vec3 col = hsv2rgb(hsv);
    float line = smoothstep(0.35, 0.8, edges(uv, uSmooth * 0.35)) * uOutline;
    return mix(col, col * 0.5, line);
}
