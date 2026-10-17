// @name Gold Relief
// @category Stylize
// @desc The picture stamped into polished gold (or silver) with shiny highlights.
// @param uDepth "Depth" 0.5 6.0 3.0
// @param uShine "Shine" 0.0 1.0 0.6
// @choice uMetal "Metal" "Gold|Silver|Copper" 0

vec3 effect(vec2 uv) {
    vec2 g = gradient(uv, 1.5) * 0.25 * uDepth;
    vec3 n = normalize(vec3(-g, 1.0));
    vec3 l = normalize(vec3(-0.5, -0.6, 0.65));
    float diff = max(dot(n, l), 0.0);
    float spec = pow(max(dot(n, normalize(l + vec3(0.0, 0.0, 1.0))), 0.0), 40.0) * uShine;
    vec3 metal = uMetal < 0.5 ? vec3(1.0, 0.78, 0.34) : (uMetal < 1.5 ? vec3(0.85, 0.87, 0.9) : vec3(0.95, 0.55, 0.38));
    float t = toneLuma(blur(uv, 1.0));
    vec3 base = metal * (0.35 + 0.65 * diff) * (0.75 + 0.35 * t);
    return base + vec3(spec) * mix(metal, vec3(1.0), 0.5);
}
