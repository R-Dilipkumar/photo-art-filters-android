// @name Paper Cut-Out
// @category Stylize
// @desc Layers of coloured paper cut to the picture's shapes, stacked with soft shadows.
// @param uLayers "Layers" 3.0 7.0 5.0
// @param uShadow "Shadow" 0.0 1.0 0.6
// @param uSmooth "Simplify" 1.0 12.0 5.0

float layerAt(vec2 uv) {
    return floor(clamp(blurTone(uv, uSmooth), 0.0, 0.999) * uLayers);
}

vec3 effect(vec2 uv) {
    vec2 p = toPx(uv);
    float level = layerAt(uv);
    // Lighter layers sit on top and cast shadows down-right onto darker ones.
    float above = layerAt(uv - px() * vec2(3.0, 4.0));
    float shadow = step(level + 0.5, above) * uShadow;
    vec3 hsv = rgb2hsv(blur(uv, uSmooth * 2.0));
    hsv.y = clamp(hsv.y * 0.9 + 0.1, 0.0, 1.0);
    hsv.z = 0.25 + 0.75 * (level + 0.5) / uLayers;
    vec3 col = hsv2rgb(hsv);
    col *= 0.94 + 0.06 * paperGrain(p);
    return col * (1.0 - shadow * 0.35);
}
