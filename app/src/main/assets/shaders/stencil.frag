// @name Stencil Graffiti
// @category Ink
// @desc Three-tone spray-paint stencil on a wall.
// @param uLow "Shadow Level" 0.1 0.6 0.35
// @param uHigh "Light Level" 0.4 0.9 0.65
// @param uSpray "Spray Noise" 0.0 1.0 0.4
// @color uDark "Dark Paint" #111111
// @color uMid "Mid Paint" #D7263D
// @color uWall "Wall" #EDE7DC

vec3 effect(vec2 uv) {
    vec2 p = toPx(uv);
    float spray = (vnoise(p * 0.4) - 0.5) * 0.12 * uSpray;
    float y = blurTone(uv, 2.5) + spray;
    float aa = 0.02;
    float dark = 1.0 - smoothstep(uLow - aa, uLow + aa, y);
    float mid = 1.0 - smoothstep(uHigh - aa, uHigh + aa, y);
    vec3 wall = uWall * (0.9 + 0.1 * fbm(p * 0.02)) * (0.96 + 0.04 * vnoise(p * 0.3));
    vec3 c = mix(wall, uMid, mid);
    c = mix(c, uDark, dark);
    // Overspray specks around painted areas.
    float speck = step(0.985 - uSpray * 0.03, hash12(floor(p / 2.0))) * mid;
    return mix(c, uDark, speck * 0.5);
}
