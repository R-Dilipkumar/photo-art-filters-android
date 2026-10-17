// @name Wave Warp
// @category Distort
// @desc Wobbly sine-wave distortion, like a heat haze or a flag in the wind.
// @param uAmp "Amplitude" 0.0 40.0 12.0
// @param uWave "Wavelength" 20.0 400.0 120.0
// @param uTurb "Turbulence" 0.0 1.0 0.3

vec3 effect(vec2 uv) {
    vec2 p = toPx(uv);
    float n = (fbm(p * 0.005) - 0.5) * uTurb * 6.0;
    vec2 offset = vec2(
        sin(p.y / uWave * TAU + n) * uAmp,
        sin(p.x / uWave * TAU * 0.8 + n) * uAmp * 0.6
    );
    return src(uv + toUv(offset));
}
