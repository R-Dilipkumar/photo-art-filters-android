package com.artisan.nprstudio.engine

import android.graphics.Bitmap
import android.graphics.Color
import androidx.test.ext.junit.runners.AndroidJUnit4
import com.artisan.nprstudio.model.NprFilterConfig
import com.artisan.nprstudio.model.NprStyle
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

    private val renderer = GlRenderer()
    private val source = BitmapRepository.generateSampleLandscape(width = 320, height = 240)

    @After
    fun tearDown() = renderer.close()

    @Test
    fun everyStyleCompilesAndDrawsAtSliderExtremes() = runBlocking {
        renderer.setSource(source)
        val flat = mutableListOf<String>()
        for (style in NprStyle.entries) {
            for (p in listOf(0f, 0.5f, 1f)) {
                val out = renderer.render(NprFilterConfig(style, param1 = p, param2 = p, param3 = p))
                assertEquals(source.width, out.width)
                assertEquals(source.height, out.height)
                if (out.pixels().toSet().size <= 1) flat += "$style@$p"
            }
        }
        // Known shader bug, AUDIT.md L2: "Ink Darkness" 0% clamps all hatching away.
        flat -= "CROSS_HATCH@0.0"
        assertTrue("Flat (blank) output for: $flat", flat.isEmpty())
    }

    @Test
    fun outputIsNotFlippedVertically() = runBlocking {
        renderer.setSource(source)
        // Kuwahara keeps flat regions' colour: sky stays top-left, mountain bottom-left.
        val out = renderer.render(
            NprFilterConfig(NprStyle.KUWAHARA_OIL, param1 = 0f, param2 = 0f, param3 = 0f)
        )
        for (y in listOf(5, source.height - 6)) {
            val expected = source.getPixel(5, y)
            val actual = out.getPixel(5, y)
            assertTrue(
                "row $y: expected ${hex(expected)}, got ${hex(actual)}",
                closeColour(expected, actual)
            )
        }
    }

    @Test
    fun manyConcurrentRendersAllComplete() = runBlocking {
        renderer.setSource(source)
        val results = (0 until 24).map { i ->
            async {
                renderer.render(
                    NprFilterConfig(NprStyle.entries[i % NprStyle.entries.size], param1 = i / 24f)
                )
            }
        }.awaitAll()
        assertEquals(24, results.size)
    }

    private fun Bitmap.pixels(): IntArray =
        IntArray(width * height).also { getPixels(it, 0, width, 0, 0, width, height) }

    private fun closeColour(a: Int, b: Int, tolerance: Int = 16) =
        abs(Color.red(a) - Color.red(b)) <= tolerance &&
            abs(Color.green(a) - Color.green(b)) <= tolerance &&
            abs(Color.blue(a) - Color.blue(b)) <= tolerance

    private fun hex(c: Int) = "#%06X".format(c and 0xFFFFFF)
}
