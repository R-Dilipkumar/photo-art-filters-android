// @name Manga
// @category Comic & Pop
// @desc Black-and-white manga page: screentone in the mid tones, hatching in shadow, clean lines.
// @param uTone "Screentone Size" 2.5 8.0 4.0
// @param uLine "Line Weight" 0.5 2.5 1.2
// @param uContrastAmt "Contrast" 0.5 2.0 1.2

vec3 effect(vec2 uv) {
    vec2 p = toPx(uv);
    float t = clamp((blurTone(uv, 1.5) - 0.5) * uContrastAmt + 0.5, 0.0, 1.0);
    vec2 q = rot(radians(45.0)) * p / uTone;
    float dots = disc(length(fract(q) - 0.5), 0.3);
    vec2 h = rot(radians(-30.0)) * p;
    float hatch = stripe(h.y / 3.0, 0.4);
    // Light: paper. Mid: screentone dots. Dark: hatching. Darkest: solid black.
    float ink = dots * (1.0 - smoothstep(0.66, 0.72, t));
    ink = max(ink, hatch * (1.0 - smoothstep(0.3, 0.38, t)));
    ink = max(ink, 1.0 - smoothstep(0.12, 0.18, t));
    float line = smoothstep(0.2, 0.6, edges(uv, 1.0)) * uLine;
    return vec3(1.0 - clamp(max(ink, line), 0.0, 1.0));
}
