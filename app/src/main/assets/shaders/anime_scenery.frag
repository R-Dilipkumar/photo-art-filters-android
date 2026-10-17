// @name Anime Scenery
// @category Comic & Pop
// @desc Bright, saturated anime-background look: soft cel shading, glowing lights, crisp lines.
// @param uVivid "Colour" 1.0 2.0 1.5
// @param uGlow "Glow" 0.0 1.0 0.5
// @param uLine "Lines" 0.0 1.0 0.4

vec3 effect(vec2 uv) {
    vec3 c = bilateral(uv, 3.0, 0.15);
    vec3 hsv = rgb2hsv(c);
    hsv.y = clamp(hsv.y * uVivid, 0.0, 1.0);
    float t = mix(hsv.z, toneLuma(c), 0.5);
    float stepped = (floor(t * 5.0) + smoothstep(0.4, 0.6, fract(t * 5.0))) / 5.0;
    hsv.z = clamp(mix(t, stepped, 0.6) * 1.1, 0.0, 1.0);
    vec3 col = hsv2rgb(hsv);
    // Bright areas bleed a soft glow.
    vec3 glow = max(blur(uv, 14.0) - 0.5, 0.0) * 2.0;
    col = screen(col, glow * uGlow);
    float line = smoothstep(0.3, 0.8, edges(uv, 1.0)) * uLine;
    return mix(col, col * 0.3, line);
}
