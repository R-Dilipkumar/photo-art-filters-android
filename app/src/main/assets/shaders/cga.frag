// @name CGA Graphics
// @category Retro
// @desc 1981 PC colour graphics: black, cyan, magenta and white only, dithered.
// @param uSize "Pixel Size" 2.0 10.0 4.0
// @param uDither "Dither" 0.0 1.0 0.7
// @choice uPalette "Palette" "Cyan/Magenta|Red/Green/Yellow" 0

vec3 effect(vec2 uv) {
    vec2 cellP = floor(toPx(uv) / vec2(uSize, uSize * 1.2));
    vec3 c = srcAt(toUv((cellP + 0.5) * vec2(uSize, uSize * 1.2)), uSize * 0.5);
    c += (bayer4(cellP) - 0.5) * uDither * 0.5;
    vec3 p0 = vec3(0.0);
    vec3 p1 = uPalette < 0.5 ? vec3(0.333, 1.0, 1.0) : vec3(0.333, 1.0, 0.333);
    vec3 p2 = uPalette < 0.5 ? vec3(1.0, 0.333, 1.0) : vec3(1.0, 0.333, 0.333);
    vec3 p3 = uPalette < 0.5 ? vec3(1.0) : vec3(1.0, 1.0, 0.333);
    vec3 best = p0;
    float d = dot(c - p0, c - p0);
    float d1 = dot(c - p1, c - p1);
    if (d1 < d) { d = d1; best = p1; }
    float d2 = dot(c - p2, c - p2);
    if (d2 < d) { d = d2; best = p2; }
    float d3 = dot(c - p3, c - p3);
    if (d3 < d) { best = p3; }
    return best;
}
