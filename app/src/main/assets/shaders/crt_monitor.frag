// @name CRT Monitor
// @category Retro
// @desc Old tube screen: curved glass, scanlines, RGB phosphor mask and glow.
// @param uCurve "Curvature" 0.0 0.3 0.12
// @param uScan "Scanlines" 0.0 1.0 0.6
// @param uMask "Phosphor Mask" 0.0 1.0 0.5
// @param uLines "Line Count" 120.0 600.0 260.0

vec3 effect(vec2 uv) {
    // Bulge the picture like curved glass.
    vec2 q = uv * 2.0 - 1.0;
    q *= 1.0 + uCurve * q.yx * q.yx;
    vec2 suv = q * 0.5 + 0.5;
    if (suv.x < 0.0 || suv.x > 1.0 || suv.y < 0.0 || suv.y > 1.0) return vec3(0.0);
    float lineH = 1280.0 / max(aspect(), 1.0) / uLines;   // preview px per scanline
    vec3 c = srcAt(suv, lineH * 0.5);
    // Scanline: bright in the middle of each line, dark between.
    float row = fract(suv.y * uLines);
    float scan = mix(1.0, 0.55 + 0.45 * sin(row * PI), uScan);
    // Aperture grille: every third column favours red, green or blue.
    float col = mod(floor(toPx(uv).x), 3.0);
    vec3 mask = mix(vec3(1.0), vec3(0.6) + 0.6 * vec3(col < 0.5, col > 0.5 && col < 1.5, col > 1.5), uMask);
    vec3 glow = blur(suv, 6.0) * 0.25;
    // Dark, rounded corners of the tube.
    vec2 corner = abs(q);
    float edge = smoothstep(1.0, 0.94, max(corner.x, corner.y));
    return (c * scan * mask * 1.15 + glow) * edge * vignette(suv, 0.4);
}
