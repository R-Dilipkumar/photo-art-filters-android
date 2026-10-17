// @name Low Poly
// @category Mosaic
// @desc Faceted low-polygon art: a jittered triangle mesh with flat-coloured faces.
// @param uSize "Facet Size" 10.0 80.0 28.0
// @param uJitter "Irregularity" 0.0 0.45 0.35
// @param uShade "Facet Shading" 0.0 1.0 0.35

// Lattice vertex (i, j) in image space (units of uSize), jittered.
vec2 vert(vec2 ij) {
    vec2 base = vec2(ij.x + ij.y * 0.5, ij.y * 0.866);
    return base + (hash22(ij) - 0.5) * uJitter;
}

float side(vec2 p, vec2 a, vec2 b) { return (b.x - a.x) * (p.y - a.y) - (b.y - a.y) * (p.x - a.x); }

bool inside(vec2 p, vec2 a, vec2 b, vec2 c) {
    float s1 = side(p, a, b);
    float s2 = side(p, b, c);
    float s3 = side(p, c, a);
    return (s1 >= 0.0 && s2 >= 0.0 && s3 >= 0.0) || (s1 <= 0.0 && s2 <= 0.0 && s3 <= 0.0);
}

vec3 effect(vec2 uv) {
    vec2 p = toPx(uv) / uSize;
    // Skewed lattice cell that would hold p without jitter.
    vec2 cell = floor(vec2(p.x - p.y / 1.732, p.y / 0.866));
    vec2 face = cell * 2.0;
    vec2 a = vert(cell);
    vec2 b = vert(cell + vec2(1.0, 0.0));
    vec2 c = vert(cell + vec2(0.0, 1.0));
    vec2 centre = (a + b + c) / 3.0;
    bool found = false;
    // Jitter can move p into a neighbour's triangle, so test the 3x3 cells around.
    for (int j = -1; j <= 1; j++) {
        for (int i = -1; i <= 1; i++) {
            if (found) break;
            vec2 k = cell + vec2(float(i), float(j));
            vec2 v00 = vert(k);
            vec2 v10 = vert(k + vec2(1.0, 0.0));
            vec2 v01 = vert(k + vec2(0.0, 1.0));
            vec2 v11 = vert(k + vec2(1.0, 1.0));
            if (inside(p, v00, v10, v01)) { centre = (v00 + v10 + v01) / 3.0; face = k * 2.0; found = true; }
            else if (inside(p, v10, v11, v01)) { centre = (v10 + v11 + v01) / 3.0; face = k * 2.0 + 1.0; found = true; }
        }
    }
    vec3 col = srcAt(toUv(centre * uSize), uSize * 0.3);
    float facet = (hash12(face) - 0.5) * uShade * 0.35;
    return col * (1.0 + facet);
}
