// @name Poster
// @category Comic & Pop
// @desc Bold posterized print: a handful of flat colours and crisp edges.
// @param uLevels "Colours per Channel" 2.0 6.0 3.0
// @param uSmooth "Smoothing" 1.0 8.0 3.0
// @param uVivid "Colour" 1.0 2.5 1.5

vec3 effect(vec2 uv) {
    vec3 c = adjustSat(kuwahara(uv, uSmooth), uVivid);
    return posterize(clamp(c, 0.0, 1.0), uLevels);
}
