package com.artisan.nprstudio.engine

import android.graphics.Bitmap
import kotlin.math.sqrt

/**
 * Pure Kotlin CPU Mathematical Engine for multi-pass Sobel Contour Ink Overlay
 * or fallback structure tensor evaluation.
 */
object CpuMathEngine {

    fun applySobelInkOverlay(source: Bitmap, edgeStrength: Float): Bitmap {
        val width = source.width
        val height = source.height
        val inPixels = IntArray(width * height)
        val outPixels = IntArray(width * height)
        source.getPixels(inPixels, 0, width, 0, 0, width, height)

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
                val t  = luma[(y - 1) * width + x]
                val tr = luma[(y - 1) * width + (x + 1)]
                val l  = luma[row + (x - 1)]
                val r  = luma[row + (x + 1)]
                val bl = luma[(y + 1) * width + (x - 1)]
                val b  = luma[(y + 1) * width + x]
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
}
