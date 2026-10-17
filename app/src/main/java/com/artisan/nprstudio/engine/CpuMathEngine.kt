package com.artisan.nprstudio.engine

import android.graphics.Bitmap
import kotlin.math.roundToInt
import kotlin.math.sqrt

/**
 * Optional CPU passes on the GPU result. These need the whole image or a strict
 * pixel order (error diffusion), which a single fragment shader can't do.
 */
object CpuMathEngine {

    /** Darkens edges (Sobel magnitude) to draw ink outlines over any style. */
    fun applySobelInkOverlay(source: Bitmap, edgeStrength: Float): Bitmap {
        val width = source.width
        val height = source.height
        val inPixels = IntArray(width * height)
        source.getPixels(inPixels, 0, width, 0, 0, width, height)
        // Border pixels have no full 3x3 neighbourhood; keep them as they are.
        val outPixels = inPixels.copyOf()

        val luma = FloatArray(width * height)
        for (i in inPixels.indices) {
            val c = inPixels[i]
            val r = (c shr 16) and 0xFF
            val g = (c shr 8) and 0xFF
            val b = c and 0xFF
            luma[i] = (0.299f * r + 0.587f * g + 0.114f * b) / 255f
        }

        for (y in 1 until height - 1) {
            val row = y * width
            for (x in 1 until width - 1) {
                val tl = luma[(y - 1) * width + (x - 1)]
                val t = luma[(y - 1) * width + x]
                val tr = luma[(y - 1) * width + (x + 1)]
                val l = luma[row + (x - 1)]
                val r = luma[row + (x + 1)]
                val bl = luma[(y + 1) * width + (x - 1)]
                val b = luma[(y + 1) * width + x]
                val br = luma[(y + 1) * width + (x + 1)]

                val gx = (tr + 2f * r + br) - (tl + 2f * l + bl)
                val gy = (bl + 2f * b + br) - (tl + 2f * t + tr)
                val mag = (sqrt(gx * gx + gy * gy) * edgeStrength).coerceIn(0f, 1f)

                val orig = inPixels[row + x]
                val factor = 1f - mag
                val nr = (((orig shr 16) and 0xFF) * factor).toInt().coerceIn(0, 255)
                val ng = (((orig shr 8) and 0xFF) * factor).toInt().coerceIn(0, 255)
                val nb = ((orig and 0xFF) * factor).toInt().coerceIn(0, 255)

                outPixels[row + x] = (0xFF shl 24) or (nr shl 16) or (ng shl 8) or nb
            }
        }

        val result = Bitmap.createBitmap(width, height, Bitmap.Config.ARGB_8888)
        result.setPixels(outPixels, 0, width, 0, 0, width, height)
        return result
    }

    /**
     * Floyd–Steinberg error diffusion to [levels] steps per channel (2 = pure on/off).
     * Rows alternate direction (serpentine) to avoid diagonal worm patterns.
     */
    fun applyFloydSteinbergDither(source: Bitmap, levels: Int): Bitmap {
        val width = source.width
        val height = source.height
        val pixels = IntArray(width * height)
        source.getPixels(pixels, 0, width, 0, 0, width, height)

        val step = 255f / (levels.coerceIn(2, 32) - 1)
        // Error buffers for the current and next row, per channel, with 1 px of padding.
        var cur = FloatArray((width + 2) * 3)
        var next = FloatArray((width + 2) * 3)

        for (y in 0 until height) {
            val leftToRight = y % 2 == 0
            next.fill(0f)
            for (i in 0 until width) {
                val x = if (leftToRight) i else width - 1 - i
                val dir = if (leftToRight) 1 else -1
                val idx = y * width + x
                val c = pixels[idx]
                var out = 0xFF shl 24
                for (ch in 0 until 3) {
                    val shift = 16 - ch * 8
                    val e = (x + 1) * 3 + ch
                    val old = ((c shr shift) and 0xFF) + cur[e]
                    val q = ((old / step).roundToInt() * step).coerceIn(0f, 255f)
                    val err = old - q
                    cur[e + dir * 3] += err * 7f / 16f
                    next[e - dir * 3] += err * 3f / 16f
                    next[e] += err * 5f / 16f
                    next[e + dir * 3] += err * 1f / 16f
                    out = out or (q.roundToInt() shl shift)
                }
                pixels[idx] = out
            }
            val swap = cur
            cur = next
            next = swap
        }

        val result = Bitmap.createBitmap(width, height, Bitmap.Config.ARGB_8888)
        result.setPixels(pixels, 0, width, 0, 0, width, height)
        return result
    }
}
