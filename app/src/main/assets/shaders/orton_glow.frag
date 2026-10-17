// @name Dreamy Glow
// @category Film
// @desc The Orton effect: a soft, saturated glow layered over the sharp photo.
// @param uGlow "Glow" 0.0 1.0 0.6
// @param uRadius "Glow Size" 4.0 30.0 12.0
// @param uVivid "Saturation" 1.0 2.0 1.3

vec3 effect(vec2 uv) {
    vec3 sharp = src(uv);
    vec3 soft = adjustSat(blur(uv, uRadius), uVivid);
    soft = soft * soft * 1.2;   // the glow layer is over-exposed in the original technique
    return mix(sharp, screen(sharp, soft), uGlow);
}
