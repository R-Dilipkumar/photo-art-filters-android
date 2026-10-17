// @name Infrared
// @category Film
// @desc Infrared film: glowing white foliage and dark skies, or false-colour Aerochrome pinks.
// @choice uMode "Film" "Black & White|Aerochrome" 0
// @param uGlow "Halation" 0.0 1.0 0.5

vec3 effect(vec2 uv) {
    vec3 c = src(uv);
    // Plants reflect infrared strongly: treat "greenness" as IR brightness.
    float foliage = clamp(c.g * 1.6 - c.r * 0.4 - c.b * 0.6, 0.0, 1.0);
    vec3 halo = blur(uv, 8.0);
    float haloFoliage = clamp(halo.g * 1.6 - halo.r * 0.4 - halo.b * 0.6, 0.0, 1.0);
    if (uMode < 0.5) {
        float ir = clamp(luma(c) * 0.6 + foliage * 1.2 - c.b * 0.3, 0.0, 1.0);
        ir = max(ir, haloFoliage * uGlow * 0.8);
        return vec3(sCurve(vec3(ir), 0.5).r);
    }
    // Aerochrome: IR -> red, red -> green, green -> blue; foliage turns pink-red.
    vec3 ae = vec3(clamp(foliage * 1.3 + c.r * 0.3, 0.0, 1.0), c.r * 0.9, c.g);
    ae += vec3(haloFoliage, 0.2 * haloFoliage, 0.3 * haloFoliage) * uGlow * 0.3;
    return adjustSat(ae, 1.2);
}
