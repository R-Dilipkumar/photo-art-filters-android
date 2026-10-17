// @name Gouache
// @category Paint
// @desc Opaque matte gouache: flat colour shapes with soft paper texture.
// @param uSize "Region Size" 2.0 10.0 5.0
// @param uSteps "Colour Steps" 3.0 12.0 6.0
// @param uChalk "Chalkiness" 0.0 1.0 0.3

vec3 effect(vec2 uv) {
    vec3 c = bilateral(uv, uSize, 0.12);
    vec3 hsv = rgb2hsv(c);
    hsv.z = posterize1(hsv.z, uSteps);
    hsv.y = posterize1(hsv.y, max(uSteps * 0.6, 2.0));
    c = hsv2rgb(hsv);
    float paper = paperGrain(toPx(uv));
    return mix(c, vec3(0.97, 0.95, 0.9), uChalk * 0.25 * paper);
}
