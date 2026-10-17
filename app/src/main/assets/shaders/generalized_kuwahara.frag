// @name Generalized Kuwahara
// @category Paint
// @desc Papari's 8-sector Kuwahara: rounder, softer brush marks than the classic filter.
// @param uBrush "Brush Size" 2.0 12.0 6.0
// @param uSharp "Sharpness" 2.0 16.0 8.0
// @param uVivid "Colour Vibrance" 0.8 1.8 1.2
// @param uStrokes "Brush Texture" 0.0 1.0 0.4

vec3 effect(vec2 uv) {
    vec3 c = kuwahara8(uv, uBrush, uSharp, vec2(1.0, 0.0), vec2(0.0, 1.0));
    float strokes = brushTexture(uv, uBrush * 3.0, 0.45);
    return adjustSat(c, uVivid) * (1.0 + strokes * uStrokes * 0.12);
}
