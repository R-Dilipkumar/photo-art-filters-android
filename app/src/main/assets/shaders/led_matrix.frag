// @name LED Matrix
// @category Retro
// @desc A giant LED billboard: glowing round lights on black.
// @param uSize "LED Spacing" 4.0 24.0 9.0
// @param uLevels "Brightness Steps" 2.0 16.0 6.0
// @param uGlow "Glow" 0.0 1.0 0.5

vec3 effect(vec2 uv) {
    vec2 p = toPx(uv) / uSize;
    vec2 cell = floor(p);
    vec3 c = posterize(adjustSat(srcAt(toUv((cell + 0.5) * uSize), uSize * 0.5), 1.4), uLevels);
    float d = length(fract(p) - 0.5);
    float led = disc(d, 0.32);
    float halo = exp(-d * d * 18.0) * uGlow;
    return c * (led * 1.1 + halo * 0.6) + vec3(0.02) * (1.0 - led);
}
