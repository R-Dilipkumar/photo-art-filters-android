// @name Impasto Knife 3D
// @category Paint
// @desc Thick palette-knife paint: Kuwahara colour with lit 3D ridges (Blinn-Phong).
// @param uKnife "Knife Width" 2.0 10.0 5.0
// @param uHeight "Ridge Height" 1.0 16.0 7.0
// @param uGloss "Glossiness" 0.0 1.0 0.4
// @param uLight "Light Angle" 0.0 360.0 225.0

// Paint height: brightness of the flattened colour plus knife streaks.
float paintHeight(vec2 uv, out vec3 colour) {
    colour = kuwahara(uv, uKnife);
    vec2 p = toPx(uv);
    float streak = vnoise(rot(0.5) * p * vec2(0.04, 0.35));
    return luma(colour) + streak * 0.06;
}

vec3 effect(vec2 uv) {
    vec3 base;
    vec3 tmp;
    float h0 = paintHeight(uv, base);
    vec2 o = px() * 2.0;
    float hr = paintHeight(uv + vec2(o.x, 0.0), tmp);
    float hd = paintHeight(uv + vec2(0.0, o.y), tmp);
    vec3 n = normalize(vec3(-(hr - h0) * uHeight, -(hd - h0) * uHeight, 1.0));
    float a = radians(uLight);
    vec3 l = normalize(vec3(cos(a) * 0.6, sin(a) * 0.6, 0.8));
    vec3 hv = normalize(l + vec3(0.0, 0.0, 1.0));
    float diff = max(dot(n, l), 0.0);
    float spec = pow(max(dot(n, hv), 0.0), 28.0) * uGloss * 0.7;
    return base * (0.65 + 0.55 * diff) + vec3(spec);
}
