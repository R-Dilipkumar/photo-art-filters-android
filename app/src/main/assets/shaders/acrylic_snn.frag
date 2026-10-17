// @name Acrylic (SNN)
// @category Paint
// @desc Symmetric-nearest-neighbour filter: crisp, saturated acrylic colour.
// @param uRadius "Brush Size" 2.0 10.0 5.0
// @param uVivid "Colour" 0.8 2.0 1.35
// @param uCanvas "Canvas" 0.0 1.0 0.35

vec3 effect(vec2 uv) {
    float spacing = uRadius / 4.0;
    vec3 c0 = srcAt(uv, spacing);
    vec3 sum = c0;
    float n = 1.0;
    // For each pair of opposite neighbours, keep the one closer in colour to the centre.
    for (int j = 0; j <= 4; j++) {
        for (int i = -4; i <= 4; i++) {
            if (j == 0 && i <= 0) continue;
            vec2 o = vec2(float(i), float(j)) * spacing * px();
            vec3 a = srcAt(uv + o, spacing);
            vec3 b = srcAt(uv - o, spacing);
            vec3 da = a - c0;
            vec3 db = b - c0;
            sum += dot(da, da) < dot(db, db) ? a : b;
            n += 1.0;
        }
    }
    vec3 c = adjustSat(sum / n, uVivid);
    vec2 p = toPx(uv);
    float strokes = brushTexture(uv, uRadius * 3.0, 0.4);
    float canvas = sin(p.x * 1.5) * sin(p.y * 1.5) + (vnoise(p * 0.4) - 0.5);
    return c * (1.0 + strokes * 0.08) + canvas * uCanvas * 0.04;
}
