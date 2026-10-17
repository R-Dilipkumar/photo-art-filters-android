// @name Sepia
// @category Film
// @desc Warm brown-toned antique photograph.
// @param uTone "Tone" 0.0 1.0 0.85
// @param uFade "Fade" 0.0 1.0 0.3
// @param uVignette "Vignette" 0.0 1.0 0.4

vec3 effect(vec2 uv) {
    vec3 c = src(uv);
    vec3 sep = vec3(
        dot(c, vec3(0.393, 0.769, 0.189)),
        dot(c, vec3(0.349, 0.686, 0.168)),
        dot(c, vec3(0.272, 0.534, 0.131))
    );
    vec3 col = mix(c, sep, uTone);
    col = mix(col, vec3(0.85, 0.78, 0.65), uFade * 0.3);
    return col * vignette(uv, uVignette);
}
