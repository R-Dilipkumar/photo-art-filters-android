// @name Classic Oil Paint
// @category Paint
// @desc Classic Kuwahara filter: flat pigment patches with sharp edges and brush texture.
// @param uBrush "Brush Size" 2.0 12.0 6.0
// @param uVivid "Colour Vibrance" 0.8 1.8 1.25
// @param uStrokes "Brush Texture" 0.0 1.0 0.5
// @param uCanvas "Canvas Texture" 0.0 1.0 0.3

vec3 effect(vec2 uv) {
    vec3 c = adjustSat(kuwahara(uv, uBrush), uVivid);
    vec2 p = toPx(uv);
    float strokes = brushTexture(uv, uBrush * 3.0, 0.45);
    float weave = sin(p.x * 1.6) * sin(p.y * 1.6);
    return c * (1.0 + strokes * uStrokes * 0.12) + weave * uCanvas * 0.05;
}
