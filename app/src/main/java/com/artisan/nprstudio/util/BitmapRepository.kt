package com.artisan.nprstudio.util

import android.content.ContentValues
import android.content.Context
import android.graphics.Bitmap
import android.graphics.Canvas
import android.graphics.Color
import android.graphics.ImageDecoder
import android.graphics.LinearGradient
import android.graphics.Paint
import android.graphics.Shader
import android.net.Uri
import android.os.Build
import android.os.Environment
import android.provider.MediaStore
import kotlin.math.min

object BitmapRepository {

    fun loadAndScaleBitmap(context: Context, uri: Uri, maxDimension: Int): Bitmap {
        val source = ImageDecoder.createSource(context.contentResolver, uri)
        val raw = ImageDecoder.decodeBitmap(source) { decoder, info, _ ->
            decoder.allocator = ImageDecoder.ALLOCATOR_SOFTWARE
            val w = info.size.width
            val h = info.size.height
            if (w > maxDimension || h > maxDimension) {
                val scale = min(maxDimension.toFloat() / w, maxDimension.toFloat() / h)
                decoder.setTargetSize((w * scale).toInt(), (h * scale).toInt())
            }
        }
        return raw.copy(Bitmap.Config.ARGB_8888, false)
    }

    fun saveBitmapToGallery(context: Context, bitmap: Bitmap, title: String): Boolean {
        val filename = "ArtisanNPR_${title}_${System.currentTimeMillis()}.png"
        val values = ContentValues().apply {
            put(MediaStore.Images.Media.DISPLAY_NAME, filename)
            put(MediaStore.Images.Media.MIME_TYPE, "image/png")
            if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.Q) {
                put(MediaStore.Images.Media.RELATIVE_PATH, Environment.DIRECTORY_PICTURES + "/ArtisanNPR")
                put(MediaStore.Images.Media.IS_PENDING, 1)
            }
        }

        val resolver = context.contentResolver
        val uri = resolver.insert(MediaStore.Images.Media.EXTERNAL_CONTENT_URI, values) ?: return false

        return try {
            resolver.openOutputStream(uri)?.use { stream ->
                bitmap.compress(Bitmap.CompressFormat.PNG, 100, stream)
            }
            if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.Q) {
                values.clear()
                values.put(MediaStore.Images.Media.IS_PENDING, 0)
                resolver.update(uri, values, null, null)
            }
            true
        } catch (e: Exception) {
            false
        }
    }

    /**
     * Generates a rich procedural landscape test painting so the app works out-of-the-box
     * even before selecting a photo from the gallery.
     */
    fun generateSampleLandscape(width: Int = 900, height: Int = 675): Bitmap {
        val bmp = Bitmap.createBitmap(width, height, Bitmap.Config.ARGB_8888)
        val canvas = Canvas(bmp)
        val paint = Paint(Paint.ANTI_ALIAS_FLAG)

        // Sunset Sky Gradient
        paint.shader = LinearGradient(
            0f, 0f, 0f, height * 0.65f,
            intArrayOf(Color.rgb(32, 58, 112), Color.rgb(214, 96, 77), Color.rgb(249, 199, 102)),
            null, Shader.TileMode.CLAMP
        )
        canvas.drawRect(0f, 0f, width.toFloat(), height.toFloat(), paint)

        // Glowing Sun
        paint.shader = null
        paint.color = Color.rgb(255, 238, 170)
        canvas.drawCircle(width * 0.72f, height * 0.32f, width * 0.11f, paint)

        // Layered Mountains & Cypress Trees
        paint.color = Color.rgb(68, 52, 92)
        canvas.drawCircle(width * 0.25f, height * 0.75f, width * 0.42f, paint)
        paint.color = Color.rgb(42, 78, 72)
        canvas.drawCircle(width * 0.78f, height * 0.82f, width * 0.45f, paint)

        return bmp
    }
}
