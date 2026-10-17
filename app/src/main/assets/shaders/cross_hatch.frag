// @name Cross-Hatching
// @category Ink
// @desc Four tiers of hatching (diagonal, cross, vertical, horizontal) that build up by tone.
// @param uSpacing "Hatch Spacing" 3.0 10.0 5.0
// @param uWeight "Line Weight" 0.1 0.6 0.3
// @param uDarkness "Ink Darkness" 0.2 1.0 0.85

// 1 when y is below t, with a soft step.
float below(float y, float t) { return 1.0 - smoothstep(t - 0.05, t + 0.05, y); }

vec3 effect(vec2 uv) {
    vec2 p = toPx(uv);
    float y = blurTone(uv, 1.0);
    float h1 = stripe((p.x + p.y) / (uSpacing * 1.414), uWeight);
    float h2 = stripe((p.x - p.y) / (uSpacing * 1.414), uWeight);
    float h3 = stripe(p.x / uSpacing, uWeight);
    float h4 = stripe(p.y / uSpacing, uWeight);
    float paperLeft = (1.0 - h1 * below(y, 0.75) * 0.6)
                    * (1.0 - h2 * below(y, 0.55) * 0.6)
                    * (1.0 - h3 * below(y, 0.35) * 0.6)
                    * (1.0 - h4 * below(y, 0.18) * 0.6);
    float ink = (1.0 - paperLeft) * uDarkness / 0.87;
    return vec3(0.98, 0.96, 0.91) * (1.0 - clamp(ink, 0.0, 1.0));
}
