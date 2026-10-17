// @name Scribble Lines
// @category Sketch
// @desc One wandering pen line looping back and forth, packed tighter in dark areas.
// @param uSpacing "Line Spacing" 3.0 10.0 4.5
// @param uWander "Wander" 0.0 1.0 0.6
// @param uDensity "Density" 0.0 1.0 0.6
// @param uColor "Use Photo Colour" 0.0 1.0 0.0

vec3 effect(vec2 uv) {
    vec2 p = toPx(uv);
    vec3 c = blur(uv, 1.5);
    float dark = clamp((1.0 - toneLuma(c)) * (0.5 + uDensity), 0.0, 1.0);
    // Parallel lines pushed around by smooth noise look like a hand scribbling.
    vec2 q = rot(0.3) * p;
    float wander = (fbm(p * 0.012) - 0.5) * 60.0 + (vnoise(p * 0.05) - 0.5) * 10.0;
    float line = stripe((q.y + wander * uWander) / uSpacing, mix(0.08, 0.7, dark));
    float ink = line * smoothstep(0.05, 0.2, dark);
    float outline = smoothstep(0.2, 0.8, edges(uv, 1.5)) * 0.8;
    ink = max(ink, outline);
    vec3 inkColor = mix(vec3(0.08), c * 0.6, uColor);
    return mix(vec3(0.98, 0.97, 0.95), inkColor, ink);
}
