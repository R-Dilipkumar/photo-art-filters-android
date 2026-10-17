// @name Risograph
// @category Print
// @desc Two-colour riso print: grainy fluorescent inks, slightly off-register.
// @param uGrain "Grain" 0.0 1.0 0.6
// @param uOffset "Misregister" 0.0 8.0 3.0
// @param uBalance "Ink Balance" 0.0 1.0 0.5
// @color uInkA "Ink A" #FF48B0
// @color uInkB "Ink B" #0078BF

float grainy(vec2 p, float amount, float seed) {
    float n = vnoise(p * 0.5 + seed) * 0.6 + hash12(floor(p / 1.5) + seed) * 0.4;
    float t = mix(0.5, n, uGrain);
    return smoothstep(t - 0.08, t + 0.08, amount);
}

vec3 effect(vec2 uv) {
    vec2 p = toPx(uv);
    vec3 cB = blur(uv, 1.5);
    vec3 cA = blur(uv + px() * vec2(uOffset, -uOffset * 0.5), 1.5);
    // Ink B carries the shadows; ink A carries warm colours and mid tones.
    float b = clamp((1.0 - toneLuma(cB)) * (1.4 - uBalance * 0.8) - 0.1, 0.0, 1.0);
    float a = clamp((cA.r - cA.b) * 1.2 + (1.0 - toneLuma(cA)) * (0.2 + uBalance * 0.6), 0.0, 1.0);
    float inkA = grainy(p, a, 0.0);
    float inkB = grainy(p, b, 41.0);
    vec3 paper = vec3(0.97, 0.95, 0.91);
    vec3 col = paper * mix(vec3(1.0), uInkA, inkA * 0.9);
    return col * mix(vec3(1.0), uInkB, inkB * 0.9);
}
