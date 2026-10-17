// @name Commodore 64
// @category Retro
// @desc The C64's 16-colour palette with wide pixels and dithering.
// @param uSize "Pixel Size" 2.0 10.0 4.0
// @param uDither "Dither" 0.0 1.0 0.5

vec3 effect(vec2 uv) {
    // Multicolour mode pixels are twice as wide as they are tall.
    vec2 cellSize = vec2(uSize * 2.0, uSize);
    vec2 cellP = floor(toPx(uv) / cellSize);
    vec3 c = srcAt(toUv((cellP + 0.5) * cellSize), uSize * 0.6);
    c += (bayer4(cellP) - 0.5) * uDither * 0.25;
    vec3 pal[16] = vec3[16](
        vec3(0.0), vec3(1.0), vec3(0.408, 0.216, 0.169), vec3(0.439, 0.643, 0.698),
        vec3(0.435, 0.239, 0.525), vec3(0.345, 0.553, 0.263), vec3(0.208, 0.157, 0.475),
        vec3(0.722, 0.780, 0.435), vec3(0.435, 0.310, 0.145), vec3(0.263, 0.224, 0.0),
        vec3(0.604, 0.404, 0.349), vec3(0.267), vec3(0.424), vec3(0.604, 0.824, 0.518),
        vec3(0.424, 0.369, 0.710), vec3(0.584)
    );
    vec3 best = pal[0];
    float bestD = 1e9;
    for (int i = 0; i < 16; i++) {
        vec3 d = pal[i] - c;
        float dd = dot(d, d);
        if (dd < bestD) { bestD = dd; best = pal[i]; }
    }
    return best;
}
