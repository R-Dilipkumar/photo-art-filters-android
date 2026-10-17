// @name Linocut Colour
// @category Ink
// @desc Two-colour linoleum print with gouge marks and slightly off-register inks.
// @param uLevel "Ink Level" 0.2 0.8 0.5
// @param uGouge "Gouge Marks" 0.0 1.0 0.6
// @param uOffset "Misregister" 0.0 6.0 2.0
// @color uInk1 "Colour Ink" #C8553D
// @color uInk2 "Key Ink" #1B1B1E
// @color uPaper "Paper" #F4EBD9

vec3 effect(vec2 uv) {
    vec2 p = toPx(uv);
    float gouge = (vnoise(rot(0.4) * p * vec2(0.03, 0.3)) - 0.5) * uGouge * 0.35;
    float yKey = blurTone(uv, 1.5) + gouge;
    float yCol = blurTone(uv + px() * uOffset, 3.0) + gouge * 0.5;
    float aa = 0.02;
    float key = 1.0 - smoothstep(uLevel * 0.6 - aa, uLevel * 0.6 + aa, yKey);
    float col = 1.0 - smoothstep(uLevel + 0.15 - aa, uLevel + 0.15 + aa, yCol);
    vec3 c = uPaper * (0.96 + 0.04 * paperGrain(p));
    c = mix(c, c * uInk1, col);   // inks multiply like real overprinting
    return mix(c, uInk2, key * 0.95);
}
