// @name Silhouette
// @category Stylize
// @desc Dark shapes cut out against a glowing sunset sky.
// @param uLevel "Cut Level" 0.1 0.8 0.4
// @param uSoft "Edge Softness" 0.0 0.2 0.03
// @color uSkyTop "Sky Top" #2B1055
// @color uSkyLow "Sky Horizon" #FF7E5F

vec3 effect(vec2 uv) {
    float t = blurTone(uv, 1.2);
    float shape = 1.0 - smoothstep(uLevel - uSoft - 0.005, uLevel + uSoft + 0.005, t);
    vec3 sky = mix(uSkyTop, uSkyLow, smoothstep(0.0, 1.0, uv.y));
    sky = mix(sky, vec3(1.0, 0.9, 0.6), (1.0 - smoothstep(0.0, 0.35, length((uv - vec2(0.5, 0.75)) * vec2(aspect(), 1.0)))) * 0.6);
    return mix(sky, vec3(0.03, 0.02, 0.05), shape);
}
