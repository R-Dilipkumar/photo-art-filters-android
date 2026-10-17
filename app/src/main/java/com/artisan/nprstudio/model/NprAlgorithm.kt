package com.artisan.nprstudio.model

enum class NprStyle(
    val title: String,
    val subtitle: String,
    val primaryParamLabel: String,
    val secondaryParamLabel: String,
    val tertiaryParamLabel: String
) {
    PENCIL_SKETCH(
        title = "Graphite Sketch",
        subtitle = "Color Dodge & Gaussian Inversion",
        primaryParamLabel = "Stroke Radius",
        secondaryParamLabel = "Lead Darkness",
        tertiaryParamLabel = "Paper Grain"
    ),
    XDOG_INK(
        title = "Charcoal & Ink",
        subtitle = "Extended Difference of Gaussians",
        primaryParamLabel = "Kernel Spread",
        secondaryParamLabel = "Ink Threshold",
        tertiaryParamLabel = "Edge Contrast"
    ),
    KUWAHARA_OIL(
        title = "Classic Oil Paint",
        subtitle = "4-Quadrant Variance Minimization",
        primaryParamLabel = "Brush Size",
        secondaryParamLabel = "Color Vibrance",
        tertiaryParamLabel = "Canvas Texture"
    ),
    SMEAR_PAINT(
        title = "Smearing Paint",
        subtitle = "Structure Tensor Flow & LIC",
        primaryParamLabel = "Smear Length",
        secondaryParamLabel = "Swirl Turbulence",
        tertiaryParamLabel = "Stroke Sharpness"
    ),
    WATERCOLOR(
        title = "Wet Watercolor",
        subtitle = "Bilateral Wash & Edge Pooling",
        primaryParamLabel = "Wash Diffusion",
        secondaryParamLabel = "Pigment Bleeding",
        tertiaryParamLabel = "Paper Wetness"
    ),
    CROSS_HATCH(
        title = "Cross-Hatching",
        subtitle = "Multi-Tier Angular Engraving",
        primaryParamLabel = "Hatch Density",
        secondaryParamLabel = "Line Weight",
        tertiaryParamLabel = "Ink Darkness"
    ),
    POINTILLISM(
        title = "Pointillism",
        subtitle = "Jittered Cellular Stippling",
        primaryParamLabel = "Dot Frequency",
        secondaryParamLabel = "Dab Spread",
        tertiaryParamLabel = "Palette Quantization"
    ),
    IMPASTO_RELIEF(
        title = "Impasto Knife 3D",
        subtitle = "Kuwahara + Phong Specular Relief",
        primaryParamLabel = "Knife Width",
        secondaryParamLabel = "Paint Ridge Height",
        tertiaryParamLabel = "Glossiness"
    )
}

data class NprFilterConfig(
    val style: NprStyle = NprStyle.KUWAHARA_OIL,
    val param1: Float = 0.5f, // Normalized 0.0f..1.0f
    val param2: Float = 0.5f, // Normalized 0.0f..1.0f
    val param3: Float = 0.3f, // Normalized 0.0f..1.0f
    val useCpuRefinement: Boolean = false
)
