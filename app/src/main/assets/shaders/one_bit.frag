// @name 1-Bit Dither
// @category Retro
// @desc Just two colours and a Bayer pattern, like an early Macintosh screen.
// @param uSize "Pixel Size" 1.0 8.0 2.0
// @param uLevel "Brightness" -0.3 0.3 0.0
// @color uInk "Dark" #111111
// @color uPaper "Light" #F2F2EA

vec3 effect(vec2 uv) {
    vec2 cellP = floor(toPx(uv) / uSize);
    float t = toneLuma(srcAt(toUv((cellP + 0.5) * uSize), uSize * 0.5)) + uLevel;
    float on = step(bayer8(cellP), t);
    return mix(uInk, uPaper, on);
}
