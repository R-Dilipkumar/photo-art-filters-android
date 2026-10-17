// @name Wet-in-Wet Bloom
// @category Watercolor
// @desc Colours flood into each other, with cauliflower blooms and dark tide lines.
// @param uFlow "Flow" 0.0 1.0 0.6
// @param uBloom "Blooms" 0.0 1.0 0.5
// @param uSoft "Softness" 3.0 16.0 8.0
// @param uBloomSize "Bloom Size" 20.0 120.0 55.0

vec3 effect(vec2 uv) {
    vec2 p = toPx(uv);
    vec2 w = (vec2(fbm(p * 0.01), fbm(p * 0.01 + 3.3)) - 0.5) * 70.0 * uFlow;
    vec3 c = adjustSat(blur(uv + w * px(), uSoft), 1.2);
    // Blooms: irregular cells whose borders dry darker.
    vec4 v = voronoi(p / uBloomSize + (fbm(p * 0.02) - 0.5) * 1.2, 1.0);
    float tide = 1.0 - smoothstep(0.0, 0.1, v.y - v.x);
    float shade = hash12(v.zw) - 0.5;
    c *= 1.0 - uBloom * (tide * 0.22 + shade * 0.12);
    vec3 paper = vec3(0.98, 0.97, 0.94);
    float grain = paperGrain(p);
    return paper * c * (1.0 - (grain - 0.5) * 0.12) / 0.95;
}
