// @name Watercolor Pencil
// @category Watercolor
// @desc Coloured pencil strokes partly dissolved with a wet brush.
// @param uWet "Wetness" 0.0 1.0 0.65
// @param uAngle "Stroke Angle" 0.0 180.0 40.0
// @param uVivid "Colour" 0.8 2.0 1.4

vec3 effect(vec2 uv) {
    vec2 p = toPx(uv);
    vec3 c = adjustSat(src(uv), uVivid);
    vec2 q = rot(radians(uAngle)) * p;
    float stroke = vnoise(vec2(q.x * 0.04, q.y * 0.4));
    float pressure = 1.0 - toneLuma(c) * 0.8;
    float dryCover = smoothstep(0.2, 0.6, pressure * (0.55 + stroke * 0.6));
    vec3 paper = vec3(0.98, 0.97, 0.94);
    vec3 dry = mix(paper, c, dryCover);
    // Water dissolves the pencil into a soft wash in patches.
    vec3 wet = paper * adjustSat(blur(uv, 6.0), uVivid) / 0.95;
    float water = smoothstep(0.4, 0.7, fbm(p * 0.006) + uWet * 0.5 - 0.25);
    return mix(dry, wet, water * uWet);
}
