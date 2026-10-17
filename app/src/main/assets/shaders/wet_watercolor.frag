// @name Wet Watercolor
// @category Watercolor
// @desc Bilateral wash, soft tone steps and pigment pooling where the wash dried.
// @param uWash "Wash Diffusion" 2.0 10.0 5.0
// @param uPool "Edge Pooling" 0.0 1.0 0.6
// @param uSteps "Wash Steps" 4.0 16.0 8.0
// @param uPaper "Paper Texture" 0.0 1.0 0.5

vec3 effect(vec2 uv) {
    vec2 p = toPx(uv);
    vec3 hsv = rgb2hsv(bilateral(uv, uWash, 0.18));
    // Step the value only, so hues don't shift.
    float t = hsv.z * (uSteps - 1.0);
    hsv.z = (floor(t) + smoothstep(0.3, 0.7, fract(t))) / (uSteps - 1.0);
    vec3 wash = hsv2rgb(hsv);
    // Pigment pools at the edges of the washes (edges of the blurred image, not fine detail).
    float rim = smoothstep(0.05, 0.5, edges(uv, uWash * 0.6));
    wash *= 1.0 - rim * uPool * 0.35;
    float grain = paperGrain(p);
    wash *= 1.0 - (grain - 0.5) * uPaper * 0.2;
    return mix(wash, vec3(1.0), 0.06);
}
