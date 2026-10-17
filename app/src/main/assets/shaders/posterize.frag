// @name Posterize
// @category Stylize
// @desc Fewer colour steps per channel, with optional smoothing and dithering.
// @param uLevels "Levels" 2.0 10.0 4.0
// @param uSmooth "Smoothing" 0.0 6.0 1.5
// @toggle uDither "Dither" 0

vec3 effect(vec2 uv) {
    vec3 c = uSmooth > 0.1 ? bilateral(uv, uSmooth, 0.2) : src(uv);
    if (uDither > 0.5) c += (bayer4(floor(toPx(uv))) - 0.5) / uLevels;
    return posterize(clamp(c, 0.0, 1.0), uLevels);
}
