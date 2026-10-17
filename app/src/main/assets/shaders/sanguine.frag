// @name Sanguine Chalk
// @category Sketch
// @desc Red-brown chalk study on cream paper, like an old master drawing.
// @param uRadius "Line Width" 1.0 10.0 4.0
// @param uShade "Shading" 0.0 1.0 0.65
// @param uGrain "Paper Grain" 0.0 1.0 0.5
// @color uInk "Chalk" #8B3A1E

vec3 effect(vec2 uv) {
    vec2 p = toPx(uv);
    float y = luma(src(uv));
    float lines = 1.0 - pow(min(1.0, y / max(0.005, blurLuma(uv, uRadius))), 5.0);
    vec2 q = rot(radians(-50.0)) * p;
    float hatch = stripe(q.y / 4.0 + vnoise(q * 0.03) * 0.6, 0.5);
    float shade = (1.0 - blurTone(uv, 3.0)) * uShade * (0.45 + 0.55 * hatch);
    float grain = mix(1.0, smoothstep(0.15, 0.7, paperGrain(p)), uGrain);
    float amount = clamp(max(lines * 1.3, shade) * grain, 0.0, 1.0);
    vec3 paper = vec3(0.95, 0.90, 0.80);
    return mix(paper, uInk, amount);
}
