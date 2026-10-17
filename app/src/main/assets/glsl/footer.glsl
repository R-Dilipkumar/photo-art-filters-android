
// ---------------------------------------------------------------- footer
// Shared "Finish" controls applied after every effect.
uniform float uStrength;    // 0 = original photo, 1 = full effect
uniform float uBrightness;  // added after the effect
uniform float uContrast;    // 1 = unchanged
uniform float uSaturation;  // 1 = unchanged, 0 = grey

void main() {
    vec3 original = src(vTexCoord);
    vec3 c = effect(vTexCoord);
    c = mix(original, c, uStrength);
    c = (c - 0.5) * uContrast + 0.5 + uBrightness;
    c = mix(vec3(luma(c)), c, uSaturation);
    fragColor = vec4(clamp(c, 0.0, 1.0), 1.0);
}
