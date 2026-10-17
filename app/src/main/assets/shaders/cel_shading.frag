// @name Cel Shading
// @category Comic & Pop
// @desc Toon shading: smooth colour, a few hard bands of light, clean outlines.
// @param uBands "Light Bands" 2.0 6.0 3.0
// @param uLine "Outline" 0.0 2.0 1.0
// @param uSmooth "Smoothing" 1.0 8.0 4.0

vec3 effect(vec2 uv) {
    vec3 c = bilateral(uv, uSmooth, 0.2);
    float t = toneLuma(c);
    vec3 hsv = rgb2hsv(c);
    // Hue and saturation stay; brightness snaps to bands.
    hsv.z = mix(0.25, 1.0, (floor(t * uBands) + 0.5) / uBands);
    hsv.y = clamp(hsv.y * 1.2, 0.0, 1.0);
    vec3 col = hsv2rgb(hsv);
    float line = smoothstep(0.25, 0.7, edges(uv, 1.2)) * uLine;
    return mix(col, vec3(0.05), clamp(line, 0.0, 1.0));
}
