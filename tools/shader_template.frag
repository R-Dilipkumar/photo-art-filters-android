// Copy this file to app/src/main/assets/shaders/<your_id>.frag and edit it.
// The app finds it automatically: the header below becomes the style's name,
// its place on the dial, and its controls. Check it with:  python tools/check_shaders.py
//
// @name My Style
// @category Stylize
// @desc One line shown above the controls.
// @param uAmount "Amount" 0.0 1.0 0.5
// @param uSize "Size (preview px)" 2.0 40.0 10.0
// @color uTint "Tint" #E8436B
// @toggle uInvert "Invert" 0
// @choice uMode "Mode" "Soft|Hard" 0
//
// Control types (up to 8 per shader):
//   - @param  uName "Label" min max default   -> float slider
//   - @color  uName "Label" #RRGGBB           -> vec3 colour, swatch picker
//   - @toggle uName "Label" 0|1               -> float 0 or 1 (on/off switch)
//   - @choice uName "Label" "A|B|C" index     -> float 0, 1, 2... (chips)
// Uniforms are declared for you; just use the names. Don't call one uTexture,
// uScale, uResolution, uTexelSize, uStrength, uBrightness, uContrast or uSaturation.
//
// Helpers you get for free (see app/src/main/assets/glsl/prelude.glsl):
//   src(uv)              sharp source colour        srcAt(uv, spacing)  pre-blurred source
//   blur(uv, r)          blur, r in preview px      bilateral(uv, r, s) edge-keeping blur
//   luma(c), toneLuma(c) brightness (toneLuma auto-exposes dark/bright photos)
//   edges(uv, r), gradient(uv, r), flow4(uv, r)     edge strength / direction
//   kuwahara(uv, r), kuwahara8(...), brushTexture(uv, len, bristle)
//   vnoise, fbm, hash12, hash22, voronoi, bayer8, stripe, disc, vignette
//   rgb2hsv, hsv2rgb, adjustSat, posterize, overlay, screen, softLight, ramp3
//   toPx(uv) / toUv(p) / px(): positions and sizes in "preview pixels"
//   (1/1280 of the long side), so the preview and the export look the same.
//
// Rules of thumb: keep noise cells >= 3 preview px (finer just looks like static),
// and keep loops small (aim for under ~150 texture reads per pixel).

vec3 effect(vec2 uv) {
    vec3 c = blur(uv, uSize * 0.2);
    float t = toneLuma(c);
    if (uInvert > 0.5) t = 1.0 - t;
    float steps = uMode < 0.5 ? 6.0 : 3.0;
    vec3 tinted = mix(vec3(t), uTint * t * 1.4, uAmount);
    return posterize(tinted, steps);
}
