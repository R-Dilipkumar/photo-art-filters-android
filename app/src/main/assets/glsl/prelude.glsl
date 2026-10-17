#version 300 es
// Shared code put in front of every shader in assets/shaders/.
// A shader only writes:  vec3 effect(vec2 uv)  (uv = this pixel, 0..1).
//
// Sizes are in "preview pixels": 1 preview pixel = 1/1280 of the image's long side.
// Use px() / toPx() / toUv() and the helpers below, so the preview and the
// full-size export look the same.
precision highp float;
precision highp int;

in vec2 vTexCoord;
out vec4 fragColor;

uniform sampler2D uTexture;   // source image (mipmapped)
uniform vec2 uTexelSize;      // 1 / output size in pixels
uniform vec2 uResolution;     // output size in pixels
uniform float uScale;         // output long side / 1280

const float PI = 3.14159265359;
const float TAU = 6.28318530718;

// ---------------------------------------------------------------- sampling

// One preview pixel, as a uv offset.
vec2 px() { return uTexelSize * uScale; }
// uv -> position in preview pixels, and back.
vec2 toPx(vec2 uv) { return uv * uResolution / uScale; }
vec2 toUv(vec2 p) { return p * uScale / uResolution; }
// Image aspect (width / height); handy for round shapes in uv space.
float aspect() { return uResolution.x / uResolution.y; }

float luma(vec3 c) { return dot(c, vec3(0.299, 0.587, 0.114)); }

// Average luma of the whole image (the 1x1 mip level).
float avgLuma() { return luma(textureLod(uTexture, vec2(0.5), 20.0).rgb); }

// Luma with auto-exposure: the image's average maps to ~0.5, so dark or bright
// photos still use the full tonal range. Use for "how dark is this" decisions.
float toneLuma(vec3 c) {
    float g = clamp(log(0.5) / log(clamp(avgLuma(), 0.04, 0.96)), 0.45, 2.2);
    return pow(clamp(luma(c), 0.0, 1.0), g);
}

// Sharp source colour.
vec3 src(vec2 uv) { return textureLod(uTexture, uv, 0.0).rgb; }
// Source pre-blurred to match taps that are `spacing` preview pixels apart.
// Neighbourhood loops use this so tap count stays the same at any export size.
vec3 srcAt(vec2 uv, float spacing) {
    return textureLod(uTexture, uv, max(0.0, log2(max(spacing * uScale, 1e-3)))).rgb;
}

// ---------------------------------------------------------------- noise

float hash12(vec2 p) {
    vec3 p3 = fract(vec3(p.xyx) * 0.1031);
    p3 += dot(p3, p3.yzx + 33.33);
    return fract((p3.x + p3.y) * p3.z);
}

vec2 hash22(vec2 p) {
    vec3 p3 = fract(vec3(p.xyx) * vec3(0.1031, 0.1030, 0.0973));
    p3 += dot(p3, p3.yzx + 33.33);
    return fract((p3.xx + p3.yz) * p3.zy);
}

vec3 hash32(vec2 p) {
    vec3 p3 = fract(vec3(p.xyx) * vec3(0.1031, 0.1030, 0.0973));
    p3 += dot(p3, p3.yxz + 33.33);
    return fract((p3.xxy + p3.yzz) * p3.zyx);
}

// Smooth value noise, 0..1.
float vnoise(vec2 p) {
    vec2 i = floor(p);
    vec2 f = fract(p);
    vec2 u = f * f * (3.0 - 2.0 * f);
    float a = hash12(i);
    float b = hash12(i + vec2(1.0, 0.0));
    float c = hash12(i + vec2(0.0, 1.0));
    float d = hash12(i + vec2(1.0, 1.0));
    return mix(mix(a, b, u.x), mix(c, d, u.x), u.y);
}

// 5-octave fractal noise, about 0..1.
float fbm(vec2 p) {
    float sum = 0.0;
    float amp = 0.5;
    for (int i = 0; i < 5; i++) {
        sum += amp * vnoise(p);
        p = p * 2.03 + vec2(17.1, 9.7);
        amp *= 0.5;
    }
    return sum / 0.96875;
}

// Paper tooth for a position in preview pixels, about 0..1.
// Rule for all textures: keep noise cells >= ~3 preview pixels, finer only aliases.
float paperGrain(vec2 p) {
    return 0.55 * fbm(p * 0.06) + 0.45 * vnoise(p * 0.33);
}

// ---------------------------------------------------------------- filters

// Gaussian-like blur, `radius` in preview pixels. 25 taps at any radius:
// the mip level matching the tap spacing does the rest.
vec3 blur(vec2 uv, float radius) {
    float spacing = max(radius, 0.5) * 0.5;
    vec2 d = px() * spacing;
    vec3 sum = vec3(0.0);
    float wsum = 0.0;
    for (int y = -2; y <= 2; y++) {
        for (int x = -2; x <= 2; x++) {
            float w = exp(-float(x * x + y * y) / 3.0);
            sum += srcAt(uv + vec2(float(x), float(y)) * d, spacing) * w;
            wsum += w;
        }
    }
    return sum / wsum;
}

float blurLuma(vec2 uv, float radius) { return luma(blur(uv, radius)); }
float blurTone(vec2 uv, float radius) { return toneLuma(blur(uv, radius)); }

// Sobel gradient of luma, taps `r` preview pixels apart. Flat = 0, hard edge ~ 4.
vec2 gradient(vec2 uv, float r) {
    vec2 d = px() * r;
    float tl = luma(srcAt(uv + vec2(-d.x, -d.y), r));
    float t  = luma(srcAt(uv + vec2(0.0, -d.y), r));
    float tr = luma(srcAt(uv + vec2(d.x, -d.y), r));
    float l  = luma(srcAt(uv + vec2(-d.x, 0.0), r));
    float rr = luma(srcAt(uv + vec2(d.x, 0.0), r));
    float bl = luma(srcAt(uv + vec2(-d.x, d.y), r));
    float b  = luma(srcAt(uv + vec2(0.0, d.y), r));
    float br = luma(srcAt(uv + vec2(d.x, d.y), r));
    float gx = (tr + 2.0 * rr + br) - (tl + 2.0 * l + bl);
    float gy = (bl + 2.0 * b + br) - (tl + 2.0 * t + tr);
    return vec2(gx, gy);
}

float edges(vec2 uv, float r) { return length(gradient(uv, r)); }

// Unit vector along edges (perpendicular to the gradient); (1,0) on flat areas.
vec2 flowAt(vec2 uv, float r) {
    vec2 g = gradient(uv, r);
    float len = length(g);
    return len > 1e-4 ? vec2(-g.y, g.x) / len : vec2(1.0, 0.0);
}

// Classic 4-quadrant Kuwahara, `radius` in preview pixels, 81 taps.
vec3 kuwahara(vec2 uv, float radius) {
    float spacing = max(radius, 1.0) / 4.0;
    vec2 d = px() * spacing;
    vec3 m0 = vec3(0.0); vec3 m1 = vec3(0.0); vec3 m2 = vec3(0.0); vec3 m3 = vec3(0.0);
    vec3 s0 = vec3(0.0); vec3 s1 = vec3(0.0); vec3 s2 = vec3(0.0); vec3 s3 = vec3(0.0);
    for (int j = -4; j <= 4; j++) {
        for (int i = -4; i <= 4; i++) {
            vec3 c = srcAt(uv + vec2(float(i), float(j)) * d, spacing);
            vec3 c2 = c * c;
            if (i <= 0 && j <= 0) { m0 += c; s0 += c2; }
            if (i >= 0 && j <= 0) { m1 += c; s1 += c2; }
            if (i >= 0 && j >= 0) { m2 += c; s2 += c2; }
            if (i <= 0 && j >= 0) { m3 += c; s3 += c2; }
        }
    }
    m0 /= 25.0; m1 /= 25.0; m2 /= 25.0; m3 /= 25.0;
    vec3 v0 = s0 / 25.0 - m0 * m0;
    vec3 v1 = s1 / 25.0 - m1 * m1;
    vec3 v2 = s2 / 25.0 - m2 * m2;
    vec3 v3 = s3 / 25.0 - m3 * m3;
    float e0 = v0.r + v0.g + v0.b;
    float e1 = v1.r + v1.g + v1.b;
    float e2 = v2.r + v2.g + v2.b;
    float e3 = v3.r + v3.g + v3.b;
    vec3 best = m0;
    float bestVar = e0;
    if (e1 < bestVar) { bestVar = e1; best = m1; }
    if (e2 < bestVar) { bestVar = e2; best = m2; }
    if (e3 < bestVar) { best = m3; }
    return best;
}

// Cheap edge direction (4 taps, central differences), unit length; (1,0) on flat areas.
vec2 flow4(vec2 uv, float r) {
    vec2 d = px() * r;
    float l = luma(srcAt(uv - vec2(d.x, 0.0), r));
    float rr = luma(srcAt(uv + vec2(d.x, 0.0), r));
    float t = luma(srcAt(uv - vec2(0.0, d.y), r));
    float b = luma(srcAt(uv + vec2(0.0, d.y), r));
    vec2 g = vec2(rr - l, b - t);
    float len = length(g);
    return len > 1e-4 ? vec2(-g.y, g.x) / len : vec2(1.0, 0.0);
}

// Brush-stroke texture: fine noise smeared along the edge flow (a small line integral
// convolution). Returns about -1..1 (0 = no change). `len` = stroke length in preview px,
// `bristle` = bristle fineness (cells per px across the stroke, ~0.3..0.7).
float brushTexture(vec2 uv, float len, float bristle) {
    float stepPx = len / 8.0;
    vec2 pos = uv;
    vec2 dir = flow4(uv, 2.0);
    float sum = vnoise(toPx(uv) * bristle);
    vec2 back = uv;
    vec2 backDir = -dir;
    for (int i = 0; i < 4; i++) {
        vec2 d = flow4(pos, 2.0);
        if (dot(d, dir) < 0.0) d = -d;
        dir = d;
        pos += d * px() * stepPx;
        vec2 b = flow4(back, 2.0);
        if (dot(b, backDir) < 0.0) b = -b;
        backDir = b;
        back += b * px() * stepPx;
        sum += vnoise(toPx(pos) * bristle) + vnoise(toPx(back) * bristle);
    }
    // Averaging 9 samples shrinks the range; stretch it back out.
    return clamp((sum / 9.0 - 0.5) * 4.0, -1.0, 1.0);
}

// 8-sector "generalized" Kuwahara (Papari et al. 2007), ~57 taps. Offsets go through
// axisX / axisY, so the sampling disc can be rotated and stretched (anisotropic).
// q: sharpness (8 is typical).
// One sector's contribution to the final colour (weight favours low variance).
void kuwaharaSector(vec3 m, vec3 s, float w, float q, inout vec3 sum, inout float wsum) {
    vec3 mean = m / w;
    vec3 v = abs(s / w - mean * mean);
    float a = 1.0 / (1.0 + pow(255.0 * (v.r + v.g + v.b), 0.5 * q));
    sum += mean * a;
    wsum += a;
}

vec3 kuwahara8(vec2 uv, float radius, float q, vec2 axisX, vec2 axisY) {
    float spacing = max(radius, 1.0) / 4.0;
    vec3 c0 = srcAt(uv, spacing);
    vec3 cc0 = c0 * c0;
    // Eight named accumulators instead of arrays: dynamic array indexing is slow on
    // many mobile GPUs.
    vec3 m0 = c0; vec3 m1 = c0; vec3 m2 = c0; vec3 m3 = c0;
    vec3 m4 = c0; vec3 m5 = c0; vec3 m6 = c0; vec3 m7 = c0;
    vec3 s0 = cc0; vec3 s1 = cc0; vec3 s2 = cc0; vec3 s3 = cc0;
    vec3 s4 = cc0; vec3 s5 = cc0; vec3 s6 = cc0; vec3 s7 = cc0;
    vec4 wA = vec4(1.0);
    vec4 wB = vec4(1.0);
    const vec4 angA = vec4(0.0, 1.0, 2.0, 3.0) * (PI / 4.0);
    const vec4 angB = vec4(4.0, 5.0, 6.0, 7.0) * (PI / 4.0);
    for (int j = -4; j <= 4; j++) {
        for (int i = -4; i <= 4; i++) {
            vec2 o = vec2(float(i), float(j));
            float r2 = dot(o, o);
            if (r2 < 0.5 || r2 > 17.0) continue;
            vec2 off = (axisX * o.x + axisY * o.y) * spacing;
            vec3 c = srcAt(uv + off * px(), spacing);
            vec3 cc = c * c;
            float g = exp(-r2 / 10.0);
            // Each tap feeds the two sectors nearest its angle, linearly.
            float th = atan(o.y, o.x);
            vec4 kA = max(1.0 - abs(mod(th - angA + PI, TAU) - PI) * (4.0 / PI), 0.0) * g;
            vec4 kB = max(1.0 - abs(mod(th - angB + PI, TAU) - PI) * (4.0 / PI), 0.0) * g;
            m0 += c * kA.x; m1 += c * kA.y; m2 += c * kA.z; m3 += c * kA.w;
            m4 += c * kB.x; m5 += c * kB.y; m6 += c * kB.z; m7 += c * kB.w;
            s0 += cc * kA.x; s1 += cc * kA.y; s2 += cc * kA.z; s3 += cc * kA.w;
            s4 += cc * kB.x; s5 += cc * kB.y; s6 += cc * kB.z; s7 += cc * kB.w;
            wA += kA;
            wB += kB;
        }
    }
    vec3 sum = vec3(0.0);
    float wsum = 0.0;
    kuwaharaSector(m0, s0, wA.x, q, sum, wsum);
    kuwaharaSector(m1, s1, wA.y, q, sum, wsum);
    kuwaharaSector(m2, s2, wA.z, q, sum, wsum);
    kuwaharaSector(m3, s3, wA.w, q, sum, wsum);
    kuwaharaSector(m4, s4, wB.x, q, sum, wsum);
    kuwaharaSector(m5, s5, wB.y, q, sum, wsum);
    kuwaharaSector(m6, s6, wB.z, q, sum, wsum);
    kuwaharaSector(m7, s7, wB.w, q, sum, wsum);
    return sum / max(wsum, 1e-20);
}

// Edge-preserving bilateral blur, 49 taps. sigmaR ~0.1 (strong edges kept) .. 0.5 (soft).
vec3 bilateral(vec2 uv, float radius, float sigmaR) {
    float spacing = max(radius, 1.0) / 3.0;
    vec2 d = px() * spacing;
    vec3 center = srcAt(uv, spacing);
    vec3 sum = vec3(0.0);
    float wsum = 0.0;
    float invR = 1.0 / (2.0 * sigmaR * sigmaR);
    for (int j = -3; j <= 3; j++) {
        for (int i = -3; i <= 3; i++) {
            vec3 c = srcAt(uv + vec2(float(i), float(j)) * d, spacing);
            vec3 diff = c - center;
            float w = exp(-float(i * i + j * j) / 9.0 - dot(diff, diff) * invR);
            sum += c * w;
            wsum += w;
        }
    }
    return sum / wsum;
}

// ---------------------------------------------------------------- colour

vec3 rgb2hsv(vec3 c) {
    vec4 K = vec4(0.0, -1.0 / 3.0, 2.0 / 3.0, -1.0);
    vec4 p = mix(vec4(c.bg, K.wz), vec4(c.gb, K.xy), step(c.b, c.g));
    vec4 q = mix(vec4(p.xyw, c.r), vec4(c.r, p.yzx), step(p.x, c.r));
    float d = q.x - min(q.w, q.y);
    float e = 1.0e-10;
    return vec3(abs(q.z + (q.w - q.y) / (6.0 * d + e)), d / (q.x + e), q.x);
}

vec3 hsv2rgb(vec3 c) {
    vec4 K = vec4(1.0, 2.0 / 3.0, 1.0 / 3.0, 3.0);
    vec3 p = abs(fract(c.xxx + K.xyz) * 6.0 - K.www);
    return c.z * mix(K.xxx, clamp(p - K.xxx, 0.0, 1.0), c.y);
}

// 0 = grey, 1 = unchanged, >1 = more vivid.
vec3 adjustSat(vec3 c, float amount) { return mix(vec3(luma(c)), c, amount); }

// `levels` steps per channel (2 = black/white per channel).
vec3 posterize(vec3 c, float levels) {
    float n = max(levels - 1.0, 1.0);
    return floor(c * n + 0.5) / n;
}

float posterize1(float v, float levels) {
    float n = max(levels - 1.0, 1.0);
    return floor(v * n + 0.5) / n;
}

vec3 multiply(vec3 a, vec3 b) { return a * b; }
vec3 screen(vec3 a, vec3 b) { return 1.0 - (1.0 - a) * (1.0 - b); }
vec3 overlay(vec3 a, vec3 b) {
    return mix(2.0 * a * b, 1.0 - 2.0 * (1.0 - a) * (1.0 - b), step(0.5, a));
}
vec3 softLight(vec3 a, vec3 b) {
    return mix(2.0 * a * b + a * a * (1.0 - 2.0 * b),
               sqrt(a) * (2.0 * b - 1.0) + 2.0 * a * (1.0 - b), step(0.5, b));
}

// 3-colour gradient map: t = 0 -> a, 0.5 -> b, 1 -> c.
vec3 ramp3(float t, vec3 a, vec3 b, vec3 c) {
    t = clamp(t, 0.0, 1.0);
    return t < 0.5 ? mix(a, b, t * 2.0) : mix(b, c, t * 2.0 - 1.0);
}

// Classic S-curve contrast around mid grey.
vec3 sCurve(vec3 c, float amount) {
    vec3 s = c * c * (3.0 - 2.0 * c);
    return mix(c, s, amount);
}

// ---------------------------------------------------------------- patterns

mat2 rot(float a) {
    float c = cos(a);
    float s = sin(a);
    return mat2(c, -s, s, c);
}

// Ordered-dither thresholds in 0..1 for a pixel position.
float bayer2(vec2 a) { a = floor(a); return fract(a.x / 2.0 + a.y * a.y * 0.75); }
float bayer4(vec2 a) { return bayer2(0.5 * a) * 0.25 + bayer2(a); }
float bayer8(vec2 a) { return bayer4(0.5 * a) * 0.25 + bayer2(a); }

// Voronoi: x = distance to nearest seed, y = to second nearest, zw = nearest cell id.
// Seed of cell id c sits at c + hash22(c) * jitter.
vec4 voronoi(vec2 p, float jitter) {
    vec2 n = floor(p);
    vec2 f = fract(p);
    float d1 = 8.0;
    float d2 = 8.0;
    vec2 best = vec2(0.0);
    for (int j = -1; j <= 1; j++) {
        for (int i = -1; i <= 1; i++) {
            vec2 g = vec2(float(i), float(j));
            vec2 r = g + hash22(n + g) * jitter - f;
            float d = dot(r, r);
            if (d < d1) {
                d2 = d1;
                d1 = d;
                best = n + g;
            } else if (d < d2) {
                d2 = d;
            }
        }
    }
    return vec4(sqrt(d1), sqrt(d2), best);
}

// Anti-aliased stripe: 1 on a line, 0 between. `coord` in stripe periods,
// `width` = line share of the period (0..1).
float stripe(float coord, float width) {
    float d = abs(fract(coord) - 0.5);
    float aa = max(fwidth(coord), 1e-4);
    return 1.0 - smoothstep(width * 0.5 - aa, width * 0.5 + aa, 0.5 - d);
}

// Anti-aliased disc mask: 1 inside radius r of distance d.
float disc(float d, float r) {
    float aa = max(fwidth(d), 1e-4);
    return 1.0 - smoothstep(r - aa, r + aa, d);
}

float vignette(vec2 uv, float amount) {
    vec2 q = uv - 0.5;
    q.x *= aspect();
    return 1.0 - amount * smoothstep(0.25, 0.95, length(q) * 1.15);
}
