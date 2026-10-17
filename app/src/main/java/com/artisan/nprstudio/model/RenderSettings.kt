package com.artisan.nprstudio.model

/** "Finish" controls shared by every shader (applied in footer.glsl). */
data class Finish(
    val strength: Float = 1f,
    val brightness: Float = 0f,
    val contrast: Float = 1f,
    val saturation: Float = 1f
)

/** Optional CPU passes run on the GPU result. */
data class PostPasses(
    val inkOutlines: Boolean = false,
    val dither: Boolean = false,
    val ditherLevels: Int = 4
)

/** Everything needed to render one image. Values are keyed by uniform name. */
data class RenderSettings(
    val shaderId: String,
    val values: Map<String, Float>,
    val colors: Map<String, Int>,
    val finish: Finish = Finish(),
    val post: PostPasses = PostPasses()
)
