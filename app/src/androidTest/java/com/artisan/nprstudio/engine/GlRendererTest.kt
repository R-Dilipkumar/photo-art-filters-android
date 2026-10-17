package com.artisan.nprstudio.engine

import android.graphics.Bitmap
import android.graphics.Color
import androidx.test.ext.junit.runners.AndroidJUnit4
import androidx.test.platform.app.InstrumentationRegistry
import com.artisan.nprstudio.model.Finish
import com.artisan.nprstudio.util.BitmapRepository
import kotlinx.coroutines.async
import kotlinx.coroutines.awaitAll
import kotlinx.coroutines.runBlocking
import org.junit.After
import org.junit.Assert.assertEquals
import org.junit.Assert.assertTrue
import org.junit.Test
import org.junit.runner.RunWith
import kotlin.math.abs

/** Runs the real GL driver: every shader must compile, link and draw something. */
@RunWith(AndroidJUnit4::class)
class GlRendererTest {

    private val catalog = ShaderCatalog.load(
        InstrumentationRegistry.getInstrumentation().targetContext.assets
    )
    private val renderer = GlRenderer(catalog.vertexSource)
    private val source = BitmapRepository.generateSampleLandscape(width = 320, height = 240)

    @After
    fun tearDown() = renderer.close()

    @Test
    fun everyShaderFileParses() {
        assertTrue("Bad shader files: ${catalog.problems}", catalog.problems.isEmpty())
        assertTrue("Only ${catalog.shaders.size} shaders", catalog.shaders.isNotEmpty())
    }

    @Test
    fun everyShaderDrawsAtDefaultsAndSliderExtremes() = runBlocking {
        renderer.setSource(source)
        val failures = mutableListOf<String>()
        for (def in catalog.shaders) {
            val sliders = def.params.filterIsInstance<ShaderParam.Slider>()
            val cases = listOf(
                "default" to def.defaultValues(),
                "min" to def.defaultValues() + sliders.associate { it.uniform to it.min },
                "max" to def.defaultValues() + sliders.associate { it.uniform to it.max }
            )
            for ((label, values) in cases) {
                try {
                    val out = renderer.render(
                        def, catalog.fragmentSource(def), values, def.defaultColors(), Finish(), scale = 0.25f
                    )
                    if (out.pixels().toSet().size <= 1) failures += "${def.id}@$label: blank image"
                } catch (e: Exception) {
                    failures += "${def.id}@$label: ${e.message?.lineSequence()?.take(3)?.joinToString(" ")}"
                }
            }
        }
        assertTrue("Problems:\n" + failures.joinToString("\n"), failures.isEmpty())
    }

    @Test
    fun strengthZeroGivesBackTheOriginalTheRightWayUp() = runBlocking {
        renderer.setSource(source)
        val def = catalog.shaders.first()
        val out = renderer.render(
            def, catalog.fragmentSource(def), def.defaultValues(), def.defaultColors(),
            Finish(strength = 0f)
        )
        val expected = source.pixels()
        val actual = out.pixels()
        var worst = 0
        for (i in expected.indices) {
            worst = maxOf(worst, channelDiff(expected[i], actual[i]))
        }
        assertTrue("Max channel difference $worst", worst <= 2)
    }

    @Test
    fun manyConcurrentRendersAllComplete() = runBlocking {
        renderer.setSource(source)
        val results = (0 until 24).map { i ->
            async {
                val def = catalog.shaders[i % catalog.shaders.size]
                renderer.render(
                    def, catalog.fragmentSource(def), def.defaultValues(), def.defaultColors(), Finish()
                )
            }
        }.awaitAll()
        assertEquals(24, results.size)
    }

    private fun Bitmap.pixels(): IntArray =
        IntArray(width * height).also { getPixels(it, 0, width, 0, 0, width, height) }

    private fun channelDiff(a: Int, b: Int) = maxOf(
        abs(Color.red(a) - Color.red(b)),
        abs(Color.green(a) - Color.green(b)),
        abs(Color.blue(a) - Color.blue(b))
    )
}
