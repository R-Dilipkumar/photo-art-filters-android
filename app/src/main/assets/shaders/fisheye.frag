// @name Fisheye
// @category Distort
// @desc Bulging ultra-wide lens: the middle swells, the edges curve away.
// @param uAmount "Bulge" -0.5 1.0 0.5
// @param uZoom "Zoom" 0.6 1.4 1.0

vec3 effect(vec2 uv) {
    vec2 q = (uv - 0.5) * vec2(aspect(), 1.0);
    float rMax = length(vec2(aspect(), 1.0) * 0.5);
    float r = length(q) / rMax;
    // r^(1+k): k > 0 magnifies the centre, k < 0 pinches it.
    float rs = pow(r, 1.0 + uAmount) / uZoom;
    vec2 s = r > 1e-4 ? q / r * rs * rMax : q;
    vec2 suv = s / vec2(aspect(), 1.0) + 0.5;
    if (suv.x < 0.0 || suv.x > 1.0 || suv.y < 0.0 || suv.y > 1.0) return vec3(0.0);
    return src(suv);
}
