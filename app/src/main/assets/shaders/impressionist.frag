// @name Impressionist
// @category Paint
// @desc Short, thick brush dabs that follow the forms, like Monet.
// @param uSize "Dab Size" 4.0 20.0 9.0
// @param uLength "Dab Length" 1.0 3.0 2.2
// @param uJitter "Colour Jitter" 0.0 0.3 0.18
// @param uVivid "Colour" 0.8 1.8 1.3

vec3 effect(vec2 uv) {
    vec2 g = toPx(uv) / uSize;
    vec2 base = floor(g);
    vec3 col = adjustSat(blur(uv, uSize), uVivid);   // under-painting
    float best = -1.0;
    float bestDist = 1.0;
    float halfW = 0.32;
    float halfL = clamp(0.32 * uLength, 0.32, 1.0);
    for (int j = -1; j <= 1; j++) {
        for (int i = -1; i <= 1; i++) {
            vec2 c = base + vec2(float(i), float(j));
            vec3 h = hash32(c);
            vec2 center = c + 0.5 + (h.xy - 0.5) * 0.6;
            vec2 cuv = toUv(center * uSize);
            vec2 dir = flow4(cuv, uSize * 0.5);
            float ang = atan(dir.y, dir.x) + (h.z - 0.5) * 0.6;
            vec2 q = rot(ang) * (g - center);          // stroke frame: x along the dab
            float dist = length(vec2(max(abs(q.x) - halfL + halfW, 0.0), q.y)) - halfW;
            dist += (vnoise(vec2(q.x * 3.0, q.y * 18.0) + h.xy * 50.0) - 0.5) * 0.08;
            if (dist < 0.0 && h.z > best) {
                best = h.z;
                bestDist = dist;
                vec3 paint = adjustSat(srcAt(cuv, uSize * 0.3), uVivid);
                float bristle = vnoise(vec2(q.x * 2.0, q.y * 14.0) + h.yz * 40.0);
                vec3 tint = vec3(1.0) + (hash32(c + 9.1) - 0.5) * uJitter;
                col = paint * tint * (1.0 + (h.x - 0.5) * uJitter * 2.0) * (0.85 + 0.25 * bristle);
            }
        }
    }
    // Paint is thicker in the middle of a dab: darken its rim a little.
    float rim = best >= 0.0 ? smoothstep(-0.12, 0.0, bestDist) : 0.0;
    return col * (1.0 - rim * 0.25);
}
