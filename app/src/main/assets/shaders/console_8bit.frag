// @name 8-bit Console
// @category Retro
// @desc Home-console sprite look: big pixels, few colours per channel, ordered dither.
// @param uSize "Pixel Size" 2.0 12.0 4.0
// @param uLevels "Levels per Channel" 2.0 6.0 4.0
// @param uDither "Dither" 0.0 1.0 0.6
// @param uVivid "Colour" 0.8 2.0 1.3

vec3 effect(vec2 uv) {
    vec2 cellP = floor(toPx(uv) / uSize);
    vec3 c = adjustSat(srcAt(toUv((cellP + 0.5) * uSize), uSize * 0.5), uVivid);
    c += (bayer8(cellP) - 0.5) * uDither / (uLevels - 1.0);
    return posterize(clamp(c, 0.0, 1.0), uLevels);
}
