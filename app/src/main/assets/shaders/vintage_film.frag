// @name Vintage Film
// @category Film
// @desc Faded 1970s print: warm cast, lifted blacks, grain, scratches and dust.
// @param uFade "Fade" 0.0 1.0 0.5
// @param uGrain "Grain" 0.0 1.0 0.5
// @param uScratch "Scratches & Dust" 0.0 1.0 0.4
// @param uWarm "Warmth" 0.0 1.0 0.6

vec3 effect(vec2 uv) {
    vec2 p = toPx(uv);
    vec3 c = sCurve(src(uv), 0.3);
    c = mix(c, c * vec3(1.08, 1.0, 0.82) + vec3(0.04, 0.02, 0.0), uWarm);
    c = mix(c, c * 0.8 + 0.12, uFade);
    c = adjustSat(c, 1.0 - uFade * 0.35);
    c += (vnoise(p * 0.7) + hash12(floor(p)) - 1.0) * uGrain * 0.12;
    // A few thin vertical scratches that come and go.
    float scratch = 0.0;
    for (int i = 0; i < 3; i++) {
        float fi = float(i);
        float x0 = hash12(vec2(fi, 3.0)) * uResolution.x / uScale;
        float wobble = sin(p.y * 0.01 + fi) * 3.0;
        float visible = step(0.35, vnoise(vec2(p.y * 0.02, fi * 5.0)));
        scratch += (1.0 - smoothstep(0.3, 1.2, abs(p.x - x0 - wobble))) * visible;
    }
    c += scratch * uScratch * 0.25;
    float dust = step(0.997, hash12(floor(p / 3.0) + 11.0)) * uScratch;
    c = mix(c, vec3(0.1), dust * 0.7);
    return c * vignette(uv, 0.5);
}
