// @name Line Art
// @category Ink
// @desc Clean contour lines only, like an inked colouring page.
// @param uDetail "Detail" 0.6 3.0 1.2
// @param uThreshold "Sensitivity" 0.05 0.6 0.18
// @param uWeight "Line Weight" 0.5 3.0 1.2
// @color uInk "Ink" #111111

vec3 effect(vec2 uv) {
    // Edges at two scales: fine detail plus bold outer shapes.
    float fine = edges(uv, uDetail);
    float bold = edges(uv, uDetail * 2.5);
    float e = max(fine, bold * 0.8) * uWeight;
    float ink = smoothstep(uThreshold, uThreshold + 0.25, e);
    return mix(vec3(1.0), uInk, ink);
}
