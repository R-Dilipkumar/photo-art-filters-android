// @name Oil Slick
// @category Stylize
// @desc Thin-film rainbow swirls, like petrol on a wet road, flowing over the photo.
// @param uAmount "Iridescence" 0.0 1.0 0.6
// @param uScale2 "Swirl Size" 50.0 600.0 200.0
// @param uBands "Colour Bands" 1.0 6.0 3.0

vec3 effect(vec2 uv) {
    vec2 p = toPx(uv);
    vec3 c = src(uv);
    // Film thickness varies smoothly; colour cycles with thickness.
    float thickness = fbm(p / uScale2 + fbm(p / (uScale2 * 0.5)) * 1.5) * uBands + toneLuma(c) * 0.8;
    vec3 film = 0.5 + 0.5 * cos(TAU * (thickness + vec3(0.0, 0.33, 0.67)));
    vec3 col = mix(c, screen(c * 0.7, film * 0.8), uAmount);
    return col;
}
