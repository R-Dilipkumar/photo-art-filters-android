// @name Dot Grid
// @category Mosaic
// @desc Full-colour round dots on black that grow with brightness, like a lightbox.
// @param uSize "Dot Spacing" 4.0 30.0 14.0
// @param uMin "Smallest Dot" 0.0 0.4 0.1
// @color uBack "Background" #0B0B0E

vec3 effect(vec2 uv) {
    vec2 p = toPx(uv) / uSize;
    vec2 cell = floor(p);
    vec3 c = srcAt(toUv((cell + 0.5) * uSize), uSize * 0.4);
    float r = mix(uMin, 0.5, sqrt(toneLuma(c)));
    float dotMask = disc(length(fract(p) - 0.5), r);
    return mix(uBack, adjustSat(c, 1.2), dotMask);
}
