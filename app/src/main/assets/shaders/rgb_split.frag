// @name RGB Split
// @category Glitch & Neon
// @desc Red, green and blue pulled apart, in one direction or outward like a cheap lens.
// @param uAmount "Split" 0.0 24.0 5.0
// @param uAngle "Direction" 0.0 360.0 0.0
// @toggle uRadial "Lens Style (Outward)" 0

vec3 effect(vec2 uv) {
    float a = radians(uAngle);
    vec2 dir = uRadial > 0.5 ? (uv - 0.5) * 2.0 : vec2(cos(a), sin(a));
    vec2 o = dir * px() * uAmount;
    return vec3(src(uv + o).r, src(uv).g, src(uv - o).b);
}
