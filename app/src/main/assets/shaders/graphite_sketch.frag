// @name Graphite Sketch
// @category Sketch
// @desc Colour-dodge pencil sketch: the photo's own shading becomes graphite.
// @param uRadius "Stroke Width" 1.0 14.0 6.0
// @param uDarkness "Lead Darkness" 0.0 1.0 0.45
// @param uGrain "Paper Grain" 0.0 1.0 0.3

vec3 effect(vec2 uv) {
    float y = luma(src(uv));
    // Colour dodge of the inverted blur reduces to Y / blur(Y).
    float sketch = min(1.0, y / max(0.005, blurLuma(uv, uRadius)));
    sketch = pow(sketch, mix(0.6, 2.8, uDarkness));
    float grain = (paperGrain(toPx(uv)) - 0.5) * uGrain * 0.35;
    return vec3(clamp(sketch + grain, 0.0, 1.0));
}
