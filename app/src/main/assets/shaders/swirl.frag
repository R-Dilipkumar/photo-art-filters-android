// @name Twirl
// @category Distort
// @desc The centre of the picture twisted like a whirlpool.
// @param uAngle "Twist" -720.0 720.0 240.0
// @param uRadius "Radius" 0.1 1.0 0.5
// @param uX "Centre X" 0.0 1.0 0.5
// @param uY "Centre Y" 0.0 1.0 0.5

vec3 effect(vec2 uv) {
    vec2 c = vec2(uX, uY);
    vec2 q = (uv - c) * vec2(aspect(), 1.0);
    float r = length(q);
    float k = max(0.0, 1.0 - r / uRadius);
    q = rot(radians(uAngle) * k * k) * q;
    return src(q / vec2(aspect(), 1.0) + c);
}
