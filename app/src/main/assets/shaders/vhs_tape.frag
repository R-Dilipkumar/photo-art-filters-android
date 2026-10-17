// @name VHS Tape
// @category Retro
// @desc Worn videotape: smeared colour, wobbly lines, noise and a tracking band.
// @param uBleed "Colour Bleed" 0.0 1.0 0.6
// @param uNoise "Noise" 0.0 1.0 0.4
// @param uWobble "Wobble" 0.0 1.0 0.4
// @param uTracking "Tracking Band" 0.0 1.0 0.5

vec3 effect(vec2 uv) {
    vec2 p = toPx(uv);
    float line = floor(p.y / 2.0);
    float jitter = (vnoise(vec2(line * 0.05, 3.0)) - 0.5) * 6.0 * uWobble
                 + (hash12(vec2(line, 7.0)) - 0.5) * 1.5 * uWobble;
    // A band of bad tracking near the bottom of the frame.
    float band = 1.0 - smoothstep(0.0, 0.04, abs(uv.y - 0.82));
    jitter += band * uTracking * (hash12(vec2(line, 1.0)) - 0.5) * 30.0;
    vec2 uvj = uv + vec2(jitter, 0.0) * px();
    // Sharp brightness, but colour smeared sideways (tape stores colour at low resolution).
    vec3 c = src(uvj);
    vec3 chroma = vec3(0.0);
    for (int i = 0; i < 8; i++) {
        chroma += srcAt(uvj - vec2((float(i) + 1.0) * 1.5 * uBleed, 0.0) * px(), 2.0);
    }
    chroma /= 8.0;
    vec3 col = adjustSat(vec3(luma(c)) + (chroma - vec3(luma(chroma))), 1.2);
    col += (hash12(p + line) - 0.5) * uNoise * 0.25;
    col += band * uTracking * 0.2 * hash12(floor(p / vec2(6.0, 2.0)));
    return col * vec3(1.02, 1.0, 0.94);
}
