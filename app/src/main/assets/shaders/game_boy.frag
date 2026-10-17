// @name Game Boy
// @category Retro
// @desc Four shades of green, chunky pixels and ordered dithering, like the 1989 handheld.
// @param uSize "Pixel Size" 2.0 12.0 5.0
// @param uDither "Dither" 0.0 1.0 0.6
// @param uContrastAmt "Contrast" 0.5 2.0 1.2

vec3 effect(vec2 uv) {
    vec2 cellP = floor(toPx(uv) / uSize);
    float t = toneLuma(srcAt(toUv((cellP + 0.5) * uSize), uSize * 0.5));
    t = clamp((t - 0.5) * uContrastAmt + 0.5, 0.0, 1.0);
    t += (bayer4(cellP) - 0.5) * uDither * 0.33;
    float level = clamp(floor(t * 4.0), 0.0, 3.0);
    if (level < 0.5) return vec3(0.059, 0.220, 0.059);
    if (level < 1.5) return vec3(0.188, 0.384, 0.188);
    if (level < 2.5) return vec3(0.545, 0.675, 0.059);
    return vec3(0.608, 0.737, 0.059);
}
