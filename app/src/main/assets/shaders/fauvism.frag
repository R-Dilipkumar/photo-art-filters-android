// @name Fauvism
// @category Paint
// @desc Matisse-style wild colour: hues pushed to pure, vivid paint with blue outlines.
// @param uShift "Hue Shift" 0.0 0.5 0.15
// @param uVivid "Saturation" 1.0 3.0 2.0
// @param uBrush "Brush Size" 2.0 10.0 5.0
// @param uOutline "Outline" 0.0 1.0 0.6

vec3 effect(vec2 uv) {
    vec3 c = kuwahara(uv, uBrush);
    float y = toneLuma(c);
    vec3 hsv = rgb2hsv(c);
    // Shadows swing one way round the colour wheel, lights the other.
    hsv.x = fract(hsv.x + uShift * (0.5 - y) * 2.0);
    hsv.y = clamp(hsv.y * uVivid + 0.15, 0.0, 1.0);
    hsv.z = clamp(mix(hsv.z, y, 0.5) * 1.1 + 0.08, 0.0, 1.0);
    vec3 col = hsv2rgb(hsv);
    float line = smoothstep(0.3, 1.0, edges(uv, uBrush * 0.4)) * uOutline;
    return mix(col, vec3(0.1, 0.15, 0.45), line);
}
