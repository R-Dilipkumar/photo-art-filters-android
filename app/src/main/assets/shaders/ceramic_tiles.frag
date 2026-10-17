// @name Ceramic Tiles
// @category Mosaic
// @desc Glazed square tiles with grout lines and a shiny bevel.
// @param uSize "Tile Size" 6.0 50.0 24.0
// @param uGrout "Grout" 0.02 0.2 0.07
// @param uGloss "Glaze Shine" 0.0 1.0 0.5
// @color uGroutColor "Grout Colour" #D8D2C4

vec3 effect(vec2 uv) {
    vec2 p = toPx(uv) / uSize;
    vec2 cell = floor(p);
    vec2 f = fract(p);
    vec3 c = srcAt(toUv((cell + 0.5) * uSize), uSize * 0.4);
    c *= 0.95 + 0.1 * hash12(cell);   // each tile glazed a little differently
    vec2 e = min(f, 1.0 - f);
    float edge = min(e.x, e.y);
    float grout = 1.0 - smoothstep(uGrout, uGrout + 0.02, edge);
    // Light from the top-left: bright top/left bevel, dark bottom/right bevel.
    float bevel = smoothstep(0.18, uGrout, edge);
    float side = (f.x < 0.5 ? 1.0 : -1.0) * step(e.x, e.y) + (f.y < 0.5 ? 1.0 : -1.0) * step(e.y, e.x);
    c *= 1.0 + bevel * side * 0.18;
    float shine = smoothstep(0.75, 1.0, 1.0 - length(f - vec2(0.3))) * uGloss * 0.5;
    return mix(c + shine, uGroutColor, grout);
}
