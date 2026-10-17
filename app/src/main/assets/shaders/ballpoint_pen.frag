// @name Ballpoint Pen
// @category Sketch
// @desc Biro hatching that builds up layer on layer in the shadows.
// @param uSpacing "Line Spacing" 2.5 8.0 4.0
// @param uLayers "Hatch Layers" 1.0 4.0 4.0
// @param uOutline "Outline" 0.0 1.0 0.8
// @color uInk "Ink" #1F3A93

vec3 effect(vec2 uv) {
    vec2 p = toPx(uv);
    float dark = 1.0 - blurTone(uv, 1.5);
    float paperLeft = 1.0;
    for (int i = 0; i < 4; i++) {
        float fi = float(i);
        if (fi >= uLayers) break;
        // Each extra layer only shows in darker areas, and layers add up.
        float on = smoothstep(0.2 + fi * 0.18, 0.32 + fi * 0.18, dark);
        vec2 q = rot(radians(30.0 + fi * 50.0)) * p;
        float wobble = (vnoise(q * 0.04 + fi * 7.0) - 0.5) * 2.0;
        float line = stripe((q.y + wobble) / uSpacing, 0.32);
        paperLeft *= 1.0 - line * on * 0.6;
    }
    float outline = smoothstep(0.12, 0.6, edges(uv, 1.0)) * uOutline;
    float ink = max(1.0 - paperLeft, outline);
    vec3 paper = vec3(0.98, 0.97, 0.94);
    return mix(paper, uInk, ink * 0.92);
}
