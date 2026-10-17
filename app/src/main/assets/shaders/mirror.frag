// @name Mirror
// @category Distort
// @desc Perfect symmetry: one half (or quarter) of the photo reflected.
// @choice uMode "Mirror" "Left to Right|Right to Left|Top to Bottom|Four-Way" 0
// @param uPos "Mirror Line" 0.2 0.8 0.5

vec3 effect(vec2 uv) {
    vec2 m = uv;
    if (uMode < 0.5 || uMode > 2.5) m.x = uv.x > uPos ? 2.0 * uPos - uv.x : uv.x;
    if (uMode > 0.5 && uMode < 1.5) m.x = uv.x < uPos ? 2.0 * uPos - uv.x : uv.x;
    if (uMode > 1.5) m.y = uv.y > uPos ? 2.0 * uPos - uv.y : uv.y;
    return src(clamp(m, 0.0, 1.0));
}
