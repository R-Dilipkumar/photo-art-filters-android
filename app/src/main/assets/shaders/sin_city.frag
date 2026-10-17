// @name Sin City
// @category Comic & Pop
// @desc Stark black-and-white noir where only the reds stay in colour.
// @param uThreshold "Black Level" 0.2 0.7 0.45
// @param uRed "Red Sensitivity" 0.0 1.0 0.6
// @param uHard "Hardness" 0.0 1.0 0.7

vec3 effect(vec2 uv) {
    vec3 c = blur(uv, 1.0);
    float t = toneLuma(c);
    float soft = 0.25 * (1.0 - uHard) + 0.01;
    float bw = smoothstep(uThreshold - soft, uThreshold + soft, t);
    vec3 hsv = rgb2hsv(c);
    float hueDist = min(hsv.x, 1.0 - hsv.x);      // red sits at hue 0 / 1
    float isRed = (1.0 - smoothstep(0.03, 0.08, hueDist))
        * smoothstep(0.35 - uRed * 0.25, 0.5 - uRed * 0.25, hsv.y)
        * step(0.15, hsv.z);
    vec3 red = vec3(0.85, 0.05, 0.08) * (0.6 + 0.5 * hsv.z);
    return mix(vec3(bw), red, isRed);
}
