package com.artisan.nprstudio.engine

import com.artisan.nprstudio.model.NprStyle

object ShaderLibrary {

    const val VERTEX_SHADER = """#version 300 es
        layout(location = 0) in vec4 aPosition;
        layout(location = 1) in vec2 aTexCoord;
        out vec2 vTexCoord;
        void main() {
            gl_Position = aPosition;
            vTexCoord = aTexCoord;
        }
    """

    fun getFragmentShader(style: NprStyle): String = when (style) {
        NprStyle.PENCIL_SKETCH -> PENCIL_SKETCH_SHADER
        NprStyle.XDOG_INK -> XDOG_INK_SHADER
        NprStyle.KUWAHARA_OIL -> KUWAHARA_OIL_SHADER
        NprStyle.SMEAR_PAINT -> SMEAR_PAINT_SHADER
        NprStyle.WATERCOLOR -> WATERCOLOR_SHADER
        NprStyle.CROSS_HATCH -> CROSS_HATCH_SHADER
        NprStyle.POINTILLISM -> POINTILLISM_SHADER
        NprStyle.IMPASTO_RELIEF -> IMPASTO_RELIEF_SHADER
    }

    // Common GLSL utilities injected into shaders
    private const val COMMON_HEADER = """#version 300 es
        precision highp float;
        in vec2 vTexCoord;
        out vec4 fragColor;
        uniform sampler2D uTexture;
        uniform vec2 uTexelSize;
        uniform float uParam1;
        uniform float uParam2;
        uniform float uParam3;

        float getLuma(vec3 c) {
            return dot(c, vec3(0.299, 0.587, 0.114));
        }

        float hash12(vec2 p) {
            vec3 p3  = fract(vec3(p.xyx) * 0.1031);
            p3 += dot(p3, p3.yzx + 33.33);
            return fract((p3.x + p3.y) * p3.z);
        }
    """

    // 1. GRAPHITE PENCIL SKETCH (Color Dodge + Procedural Paper Grain)
    private const val PENCIL_SKETCH_SHADER = COMMON_HEADER + """
        void main() {
            vec3 baseColor = texture(uTexture, vTexCoord).rgb;
            float baseLuma = getLuma(baseColor);

            int radius = int(mix(2.0, 14.0, uParam1));
            float sigma = float(radius) * 0.6 + 0.5;
            float twoSigmaSq = 2.0 * sigma * sigma;

            float blurredInvLuma = 0.0;
            float weightSum = 0.0;

            for (int x = -radius; x <= radius; x++) {
                for (int y = -radius; y <= radius; y++) {
                    vec2 offset = vec2(float(x), float(y)) * uTexelSize;
                    float sampleLuma = getLuma(texture(uTexture, vTexCoord + offset).rgb);
                    float invSample = 1.0 - sampleLuma;
                    float w = exp(-float(x * x + y * y) / twoSigmaSq);
                    blurredInvLuma += invSample * w;
                    weightSum += w;
                }
            }
            blurredInvLuma /= weightSum;

            // Color Dodge Blend
            float sketch = min(1.0, baseLuma / max(0.005, 1.0 - blurredInvLuma));
            // Lead darkness gamma adjustment
            float gamma = mix(0.6, 2.8, uParam2);
            sketch = pow(sketch, gamma);

            // Procedural paper grain
            float grain = (hash12(vTexCoord / uTexelSize) - 0.5) * uParam3 * 0.25;
            sketch = clamp(sketch + grain, 0.0, 1.0);

            fragColor = vec4(vec3(sketch), 1.0);
        }
    """

    // 2. XDoG CHARCOAL & INK
    private const val XDOG_INK_SHADER = COMMON_HEADER + """
        void main() {
            int radius = int(mix(2.0, 10.0, uParam1));
            float sigma1 = mix(0.6, 2.2, uParam1);
            float sigma2 = sigma1 * 1.6;

            float g1 = 0.0, w1 = 0.0;
            float g2 = 0.0, w2 = 0.0;

            for (int x = -radius; x <= radius; x++) {
                for (int y = -radius; y <= radius; y++) {
                    float d2 = float(x * x + y * y);
                    vec2 offset = vec2(float(x), float(y)) * uTexelSize;
                    float luma = getLuma(texture(uTexture, vTexCoord + offset).rgb);

                    float weight1 = exp(-d2 / (2.0 * sigma1 * sigma1));
                    float weight2 = exp(-d2 / (2.0 * sigma2 * sigma2));

                    g1 += luma * weight1; w1 += weight1;
                    g2 += luma * weight2; w2 += weight2;
                }
            }
            g1 /= w1;
            g2 /= w2;

            float tau = mix(5.0, 35.0, uParam3);
            float dog = (1.0 + tau) * g1 - tau * g2;

            float eps = mix(0.25, 0.85, uParam2);
            float phi = 12.0;
            float edge = (dog >= eps) ? 1.0 : 1.0 + tanh(phi * (dog - eps));

            fragColor = vec4(vec3(clamp(edge, 0.0, 1.0)), 1.0);
        }
    """

    // 3. KUWAHARA OIL PAINTING
    private const val KUWAHARA_OIL_SHADER = COMMON_HEADER + """
        void main() {
            int radius = int(mix(2.0, 10.0, uParam1));
            vec3 mean[4];
            vec3 sqMean[4];
            for (int k = 0; k < 4; k++) {
                mean[k] = vec3(0.0);
                sqMean[k] = vec3(0.0);
            }

            float n = float((radius + 1) * (radius + 1));

            for (int j = -radius; j <= 0; j++) {
                for (int i = -radius; i <= 0; i++) {
                    vec3 c = texture(uTexture, vTexCoord + vec2(float(i), float(j)) * uTexelSize).rgb;
                    mean[0] += c; sqMean[0] += c * c;
                }
            }
            for (int j = -radius; j <= 0; j++) {
                for (int i = 0; i <= radius; i++) {
                    vec3 c = texture(uTexture, vTexCoord + vec2(float(i), float(j)) * uTexelSize).rgb;
                    mean[1] += c; sqMean[1] += c * c;
                }
            }
            for (int j = 0; j <= radius; j++) {
                for (int i = 0; i <= radius; i++) {
                    vec3 c = texture(uTexture, vTexCoord + vec2(float(i), float(j)) * uTexelSize).rgb;
                    mean[2] += c; sqMean[2] += c * c;
                }
            }
            for (int j = 0; j <= radius; j++) {
                for (int i = -radius; i <= 0; i++) {
                    vec3 c = texture(uTexture, vTexCoord + vec2(float(i), float(j)) * uTexelSize).rgb;
                    mean[3] += c; sqMean[3] += c * c;
                }
            }

            float minVariance = 1e10;
            vec3 finalColor = vec3(0.0);

            for (int k = 0; k < 4; k++) {
                mean[k] /= n;
                vec3 variance = abs(sqMean[k] / n - mean[k] * mean[k]);
                float totalVar = variance.r + variance.g + variance.b;
                if (totalVar < minVariance) {
                    minVariance = totalVar;
                    finalColor = mean[k];
                }
            }

            // Vibrance boost
            float luma = getLuma(finalColor);
            finalColor = mix(vec3(luma), finalColor, mix(1.0, 1.6, uParam2));

            // Subtle canvas weave
            vec2 pixelPos = vTexCoord / uTexelSize;
            float weave = sin(pixelPos.x * 0.9) * cos(pixelPos.y * 0.9) * uParam3 * 0.08;
            fragColor = vec4(clamp(finalColor + weave, 0.0, 1.0), 1.0);
        }
    """

    // 4. SMEARING PAINT (Structure Tensor + Line Integral Convolution)
    private const val SMEAR_PAINT_SHADER = COMMON_HEADER + """
        vec2 getFlowVector(vec2 uv) {
            float tl = getLuma(texture(uTexture, uv + vec2(-1.0, -1.0) * uTexelSize).rgb);
            float l  = getLuma(texture(uTexture, uv + vec2(-1.0,  0.0) * uTexelSize).rgb);
            float bl = getLuma(texture(uTexture, uv + vec2(-1.0,  1.0) * uTexelSize).rgb);
            float t  = getLuma(texture(uTexture, uv + vec2( 0.0, -1.0) * uTexelSize).rgb);
            float b  = getLuma(texture(uTexture, uv + vec2( 0.0,  1.0) * uTexelSize).rgb);
            float tr = getLuma(texture(uTexture, uv + vec2( 1.0, -1.0) * uTexelSize).rgb);
            float r  = getLuma(texture(uTexture, uv + vec2( 1.0,  0.0) * uTexelSize).rgb);
            float br = getLuma(texture(uTexture, uv + vec2( 1.0,  1.0) * uTexelSize).rgb);

            float gx = (tr + 2.0 * r + br) - (tl + 2.0 * l + bl);
            float gy = (bl + 2.0 * b + br) - (tl + 2.0 * t + tr);

            // Tangent vector orthogonal to gradient
            vec2 tangent = vec2(-gy, gx);
            float len = length(tangent);
            return (len > 0.0001) ? (tangent / len) : vec2(1.0, 0.0);
        }

        void main() {
            int steps = int(mix(6.0, 28.0, uParam1));
            float stepScale = mix(1.0, 2.5, uParam2);
            // GLSL ES has no implicit int -> float, so convert before scaling.
            float twoSigmaSq = float(steps * steps) * 0.5;

            vec2 localFlow = getFlowVector(vTexCoord);
            vec2 posF = vTexCoord;
            vec2 posB = vTexCoord;
            vec2 prevF = localFlow;
            vec2 prevB = -localFlow;
            vec3 accumColor = texture(uTexture, vTexCoord).rgb;
            float totalWeight = 1.0;

            for (int i = 1; i <= steps; i++) {
                float w = exp(-float(i * i) / twoSigmaSq);
                vec2 dirF = getFlowVector(posF);
                vec2 dirB = getFlowVector(posB);
                // t and -t are the same line; flip to keep walking away from the start.
                if (dot(dirF, prevF) < 0.0) dirF = -dirF;
                if (dot(dirB, prevB) < 0.0) dirB = -dirB;
                prevF = dirF;
                prevB = dirB;

                posF += dirF * uTexelSize * stepScale;
                posB += dirB * uTexelSize * stepScale;

                accumColor += texture(uTexture, posF).rgb * w;
                accumColor += texture(uTexture, posB).rgb * w;
                totalWeight += 2.0 * w;
            }

            vec3 smeared = accumColor / totalWeight;
            // Brush bristle ridge modulation along tangent
            float bristle = sin(dot(vTexCoord / uTexelSize, vec2(-localFlow.y, localFlow.x)) * 1.4);
            smeared += bristle * uParam3 * 0.06;

            fragColor = vec4(clamp(smeared, 0.0, 1.0), 1.0);
        }
    """

    // 5. WET WATERCOLOR
    private const val WATERCOLOR_SHADER = COMMON_HEADER + """
        void main() {
            int radius = int(mix(2.0, 8.0, uParam1));
            vec3 center = texture(uTexture, vTexCoord).rgb;
            vec3 sum = vec3(0.0);
            float totalWeight = 0.0;

            for (int x = -radius; x <= radius; x++) {
                for (int y = -radius; y <= radius; y++) {
                    vec2 offset = vec2(float(x), float(y)) * uTexelSize;
                    vec3 sampleCol = texture(uTexture, vTexCoord + offset).rgb;
                    float spatial = float(x * x + y * y) / float(radius * radius + 1);
                    float range = dot(sampleCol - center, sampleCol - center) * 14.0;
                    float w = exp(-spatial - range);
                    sum += sampleCol * w;
                    totalWeight += w;
                }
            }
            vec3 wash = sum / totalWeight;

            // Soft color quantization into pigment washes
            float levels = mix(14.0, 6.0, uParam1);
            wash = floor(wash * levels + 0.5) / levels;

            // Morphological edge pigment pooling (wet border darkening)
            vec3 dx = texture(uTexture, vTexCoord + vec2(uTexelSize.x * 2.0, 0.0)).rgb -
                      texture(uTexture, vTexCoord - vec2(uTexelSize.x * 2.0, 0.0)).rgb;
            vec3 dy = texture(uTexture, vTexCoord + vec2(0.0, uTexelSize.y * 2.0)).rgb -
                      texture(uTexture, vTexCoord - vec2(0.0, uTexelSize.y * 2.0)).rgb;
            float edgeMag = sqrt(dot(dx, dx) + dot(dy, dy));

            vec3 pooled = wash * (1.0 - edgeMag * uParam2 * 0.85);
            // Cold-press paper granulation
            vec2 p = vTexCoord / uTexelSize;
            float paper = (sin(p.x * 0.4) * cos(p.y * 0.4) + (hash12(p) - 0.5)) * uParam3 * 0.07;

            fragColor = vec4(clamp(pooled + paper, 0.0, 1.0), 1.0);
        }
    """

    // 6. CROSS-HATCHING ENGRAVING
    private const val CROSS_HATCH_SHADER = COMMON_HEADER + """
        void main() {
            vec3 col = texture(uTexture, vTexCoord).rgb;
            float luma = getLuma(col);

            vec2 pixel = vTexCoord / uTexelSize;
            float density = mix(0.35, 1.25, uParam1);
            float thickness = mix(0.2, 0.75, uParam2);

            float h1 = sin((pixel.x + pixel.y) * density);
            float h2 = sin((pixel.x - pixel.y) * density);
            float h3 = sin(pixel.x * density * 1.2);
            float h4 = sin(pixel.y * density * 1.2);

            float ink = 1.0;
            if (luma < 0.75 && h1 < thickness) ink -= 0.35;
            if (luma < 0.55 && h2 < thickness) ink -= 0.35;
            if (luma < 0.35 && h3 < thickness) ink -= 0.35;
            if (luma < 0.18 && h4 < thickness) ink -= 0.35;

            ink = clamp(ink, 1.0 - uParam3, 1.0);
            vec3 paperTint = vec3(0.98, 0.96, 0.91);
            fragColor = vec4(paperTint * ink, 1.0);
        }
    """

    // 7. POINTILLISM / STIPPLING
    private const val POINTILLISM_SHADER = COMMON_HEADER + """
        void main() {
            float cellScale = mix(8.0, 3.0, uParam1);
            vec2 pixel = vTexCoord / uTexelSize;
            vec2 grid = floor(pixel / cellScale);
            vec2 local = fract(pixel / cellScale) - 0.5;

            vec2 jitter = vec2(hash12(grid), hash12(grid + 17.3)) - 0.5;
            vec2 sampleUv = (grid + 0.5 + jitter * 0.4) * cellScale * uTexelSize;
            vec3 paint = texture(uTexture, clamp(sampleUv, 0.0, 1.0)).rgb;

            float levels = mix(16.0, 5.0, uParam3);
            paint = floor(paint * levels + 0.5) / levels;

            float luma = getLuma(paint);
            float maxRad = mix(0.45, 0.85, uParam2);
            float dist = length(local - jitter * 0.25);
            float radius = mix(maxRad, maxRad * 0.4, luma);

            vec3 canvas = vec3(0.95, 0.93, 0.88);
            float mask = smoothstep(radius + 0.08, radius - 0.08, dist);
            fragColor = vec4(mix(canvas, paint, mask), 1.0);
        }
    """

    // 8. 3D IMPASTO KNIFE RELIEF
    private const val IMPASTO_RELIEF_SHADER = COMMON_HEADER + """
        vec3 sampleKuwahara(vec2 uv, int radius) {
            vec3 mean[2];
            vec3 sqMean[2];
            mean[0] = vec3(0.0); sqMean[0] = vec3(0.0);
            mean[1] = vec3(0.0); sqMean[1] = vec3(0.0);
            float n = float((radius + 1) * (radius + 1));
            for (int j = -radius; j <= 0; j++) {
                for (int i = -radius; i <= 0; i++) {
                    vec3 c = texture(uTexture, uv + vec2(float(i), float(j)) * uTexelSize).rgb;
                    mean[0] += c; sqMean[0] += c * c;
                }
            }
            for (int j = 0; j <= radius; j++) {
                for (int i = 0; i <= radius; i++) {
                    vec3 c = texture(uTexture, uv + vec2(float(i), float(j)) * uTexelSize).rgb;
                    mean[1] += c; sqMean[1] += c * c;
                }
            }
            mean[0] /= n; mean[1] /= n;
            vec3 v0 = abs(sqMean[0] / n - mean[0] * mean[0]);
            vec3 v1 = abs(sqMean[1] / n - mean[1] * mean[1]);
            return ((v0.r + v0.g + v0.b) < (v1.r + v1.g + v1.b)) ? mean[0] : mean[1];
        }

        void main() {
            int radius = int(mix(2.0, 7.0, uParam1));
            vec3 basePaint = sampleKuwahara(vTexCoord, radius);
            vec3 rightPaint = sampleKuwahara(vTexCoord + vec2(uTexelSize.x * 2.0, 0.0), radius);
            vec3 downPaint  = sampleKuwahara(vTexCoord + vec2(0.0, uTexelSize.y * 2.0), radius);

            float bumpScale = mix(2.0, 14.0, uParam2);
            float dhdx = (getLuma(rightPaint) - getLuma(basePaint)) * bumpScale;
            float dhdy = (getLuma(downPaint)  - getLuma(basePaint)) * bumpScale;

            vec3 normal = normalize(vec3(-dhdx, -dhdy, 1.0));
            vec3 lightDir = normalize(vec3(-0.6, -0.6, 0.8));
            vec3 viewDir = vec3(0.0, 0.0, 1.0);
            vec3 halfVec = normalize(lightDir + viewDir);

            float diff = max(dot(normal, lightDir), 0.0);
            float spec = pow(max(dot(normal, halfVec), 0.0), 28.0) * uParam3 * 0.7;

            vec3 litPaint = basePaint * (0.65 + 0.55 * diff) + vec3(spec);
            fragColor = vec4(clamp(litPaint, 0.0, 1.0), 1.0);
        }
    """
}
