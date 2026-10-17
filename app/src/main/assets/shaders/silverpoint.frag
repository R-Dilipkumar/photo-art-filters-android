// @name Silverpoint
// @category Sketch
// @desc Delicate grey lines on pale toned paper, Renaissance style.
// @param uDetail "Detail" 0.5 3.0 1.0
// @param uTone "Tone" 0.0 1.0 0.5
// @param uSpacing "Hatch Spacing" 2.5 6.0 3.5
// @color uPaper "Paper" #E6E2D3

vec3 effect(vec2 uv) {
    vec2 p = toPx(uv);
    float line = smoothstep(0.08, 0.5, edges(uv, uDetail));
    float dark = (1.0 - blurTone(uv, 2.5)) * uTone;
    vec2 q = rot(radians(55.0)) * p;
    float hatch = stripe(q.y / uSpacing, 0.3) * smoothstep(0.1, 0.35, dark);
    float amount = clamp(max(line * 0.85, hatch * 0.6), 0.0, 1.0);
    vec3 silver = vec3(0.38, 0.38, 0.37);
    return mix(uPaper * (0.96 + 0.04 * paperGrain(p)), silver, amount);
}
