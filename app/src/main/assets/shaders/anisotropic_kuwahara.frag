// @name Anisotropic Kuwahara
// @category Paint
// @desc Kuwahara sectors stretched along the image's edges: flowing, brushy oil strokes.
// @param uBrush "Brush Size" 2.0 12.0 6.0
// @param uStretch "Stretch" 1.0 3.0 2.0
// @param uSharp "Sharpness" 2.0 16.0 8.0
// @param uStrokes "Brush Texture" 0.0 1.0 0.6

vec3 effect(vec2 uv) {
    // Smoothed local orientation; flat areas stay round.
    vec2 g = gradient(uv, max(uBrush * 0.5, 1.5));
    float strength = smoothstep(0.02, 0.3, length(g));
    vec2 across = length(g) > 1e-4 ? normalize(g) : vec2(1.0, 0.0);
    vec2 along = vec2(-across.y, across.x);
    float a = 1.0 + (uStretch - 1.0) * strength;
    // Squash across the edge, stretch along it (area stays about the same).
    vec2 axisX = across / sqrt(a);
    vec2 axisY = along * sqrt(a);
    vec3 c = adjustSat(kuwahara8(uv, uBrush, uSharp, axisX, axisY), 1.2);
    float strokes = brushTexture(uv, uBrush * 4.0, 0.5);
    return c * (1.0 + strokes * uStrokes * 0.14);
}
