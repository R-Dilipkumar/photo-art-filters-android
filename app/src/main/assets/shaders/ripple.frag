// @name Water Ripple
// @category Distort
// @desc Rings spreading out as if a pebble dropped into the picture.
// @param uAmp "Ripple Strength" 0.0 20.0 6.0
// @param uWave "Wavelength" 10.0 120.0 40.0
// @param uX "Centre X" 0.0 1.0 0.5
// @param uY "Centre Y" 0.0 1.0 0.5

vec3 effect(vec2 uv) {
    vec2 c = vec2(uX, uY);
    vec2 q = (uv - c) * uResolution / uScale;     // preview pixels from the centre
    float r = length(q);
    float wave = sin(r / uWave * TAU) * exp(-r / 600.0);
    vec2 dir = r > 1e-3 ? q / r : vec2(0.0);
    vec2 offset = dir * wave * uAmp;
    vec3 col = src(uv + toUv(offset));
    // Light catches the wave crests.
    return col * (1.0 + cos(r / uWave * TAU) * exp(-r / 600.0) * uAmp * 0.008);
}
