package com.artisan.nprstudio.util

import android.content.ContentValues
import android.content.Context
import android.graphics.Bitmap
import android.graphics.Canvas
import android.graphics.Color
import android.graphics.ImageDecoder
import android.graphics.LinearGradient
import android.graphics.Matrix
import android.graphics.Paint
import android.graphics.Path
import android.graphics.RadialGradient
import android.graphics.Shader
import android.net.Uri
import android.os.Build
import android.os.Environment
import android.provider.MediaStore
import java.util.Random
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
     * Paints a detailed sunset landscape (sky, sun, clouds, mountains, lake reflection,
     * trees, a house, flowers) so every style has something to work on before a photo
     * is loaded. Deterministic: the same picture every time.
     */
    fun generateSampleLandscape(width: Int = 1280, height: Int = 960): Bitmap {
        val bmp = Bitmap.createBitmap(width, height, Bitmap.Config.ARGB_8888)
        val canvas = Canvas(bmp)
        val w = width.toFloat()
        val h = height.toFloat()
        val rnd = Random(7)
        val paint = Paint(Paint.ANTI_ALIAS_FLAG)
        val horizon = h * 0.56f
        // Solid base: anti-aliased seams between shapes must not leave see-through pixels.
        canvas.drawColor(Color.rgb(30, 40, 60))

        // Sky
        paint.shader = LinearGradient(
            0f, 0f, 0f, horizon,
            intArrayOf(
                Color.rgb(28, 52, 110), Color.rgb(118, 88, 150),
                Color.rgb(236, 120, 86), Color.rgb(252, 206, 120)
            ),
            floatArrayOf(0f, 0.45f, 0.8f, 1f), Shader.TileMode.CLAMP
        )
        canvas.drawRect(0f, 0f, w, horizon, paint)

        // Sun with glow
        val sunX = w * 0.66f
        val sunY = horizon - h * 0.12f
        paint.shader = RadialGradient(
            sunX, sunY, w * 0.22f,
            intArrayOf(Color.argb(190, 255, 236, 180), Color.argb(0, 255, 200, 120)),
            null, Shader.TileMode.CLAMP
        )
        canvas.drawCircle(sunX, sunY, w * 0.22f, paint)
        paint.shader = null
        paint.color = Color.rgb(255, 245, 205)
        canvas.drawCircle(sunX, sunY, w * 0.055f, paint)

        // Clouds
        for (c in 0 until 5) {
            val cx = w * (0.08f + 0.21f * c)
            val cy = h * (0.10f + 0.12f * rnd.nextFloat())
            paint.color = Color.argb(150, 255, 222, 214)
            repeat(7) {
                val ox = cx + (rnd.nextFloat() - 0.5f) * w * 0.12f
                val oy = cy + (rnd.nextFloat() - 0.5f) * h * 0.03f
                val rx = w * (0.03f + 0.03f * rnd.nextFloat())
                canvas.drawOval(ox - rx, oy - rx * 0.45f, ox + rx, oy + rx * 0.45f, paint)
            }
        }

        // Mountain ridges, far to near
        fun ridge(base: Float, amp: Float, color: Int, snow: Boolean) {
            val path = Path()
            path.moveTo(0f, horizon)
            var y = base
            var x = 0f
            val points = mutableListOf<Pair<Float, Float>>()
            while (x <= w) {
                y = (y + (rnd.nextFloat() - 0.5f) * amp).coerceIn(base - amp * 1.5f, base + amp)
                points += x to y
                path.lineTo(x, y)
                x += w / 28f
            }
            path.lineTo(w, horizon)
            path.close()
            paint.color = color
            canvas.drawPath(path, paint)
            if (snow) {
                paint.color = Color.argb(200, 245, 240, 250)
                for ((px, py) in points) {
                    if (py < base - amp * 0.6f) {
                        canvas.drawCircle(px, py + 6f, w / 70f, paint)
                    }
                }
            }
        }
        ridge(horizon - h * 0.20f, h * 0.06f, Color.rgb(104, 92, 140), snow = true)
        ridge(horizon - h * 0.11f, h * 0.05f, Color.rgb(70, 74, 110), snow = false)
        ridge(horizon - h * 0.04f, h * 0.025f, Color.rgb(46, 60, 78), snow = false)

        // Lake: mirrored sky and mountains, darkened, with ripple lines
        val upper = Bitmap.createBitmap(bmp, 0, 0, width, horizon.toInt())
        val flip = Matrix().apply {
            postScale(1f, -1f)
            postTranslate(0f, horizon * 2f)
        }
        paint.alpha = 255
        canvas.drawBitmap(upper, flip, paint)
        upper.recycle()
        paint.color = Color.argb(110, 10, 30, 60)
        canvas.drawRect(0f, horizon, w, h, paint)
        paint.strokeWidth = 2f
        for (i in 0 until 60) {
            val ry = horizon + (h - horizon) * rnd.nextFloat()
            val rx = w * rnd.nextFloat()
            val len = w * (0.02f + 0.08f * rnd.nextFloat())
            paint.color = Color.argb(70, 255, 225, 190)
            canvas.drawLine(rx, ry, rx + len, ry, paint)
        }

        // Meadow on the near shore
        val meadow = Path().apply {
            moveTo(0f, h * 0.74f)
            cubicTo(w * 0.25f, h * 0.68f, w * 0.55f, h * 0.80f, w, h * 0.76f)
            lineTo(w, h)
            lineTo(0f, h)
            close()
        }
        // A shader still uses the paint's alpha, which the ripple lines left at 70.
        paint.color = Color.BLACK
        paint.shader = LinearGradient(
            0f, h * 0.70f, 0f, h,
            intArrayOf(Color.rgb(96, 140, 70), Color.rgb(40, 82, 44)), null, Shader.TileMode.CLAMP
        )
        canvas.drawPath(meadow, paint)
        paint.shader = null

        // Grass blades
        paint.strokeWidth = 2f
        for (i in 0 until 500) {
            val gx = w * rnd.nextFloat()
            val gy = h * (0.80f + 0.2f * rnd.nextFloat())
            paint.color = Color.rgb(50 + rnd.nextInt(60), 100 + rnd.nextInt(70), 40 + rnd.nextInt(30))
            canvas.drawLine(gx, gy, gx + (rnd.nextFloat() - 0.5f) * 10f, gy - 10f - 16f * rnd.nextFloat(), paint)
        }

        // Cypress trees on the left
        for (i in 0 until 4) {
            val tx = w * (0.06f + 0.07f * i)
            val base = h * (0.76f + 0.01f * i)
            val th = h * (0.22f + 0.06f * rnd.nextFloat())
            paint.color = Color.rgb(24, 52 + 6 * i, 34)
            canvas.drawOval(tx - w * 0.022f, base - th, tx + w * 0.022f, base, paint)
            paint.color = Color.rgb(60, 40, 26)
            canvas.drawRect(tx - 3f, base - 6f, tx + 3f, base + 8f, paint)
        }

        // A small house with lit windows
        val hx = w * 0.70f
        val hy = h * 0.79f
        paint.color = Color.rgb(222, 205, 176)
        canvas.drawRect(hx, hy - h * 0.08f, hx + w * 0.11f, hy, paint)
        paint.color = Color.rgb(150, 54, 44)
        canvas.drawPath(Path().apply {
            moveTo(hx - w * 0.012f, hy - h * 0.08f)
            lineTo(hx + w * 0.055f, hy - h * 0.14f)
            lineTo(hx + w * 0.122f, hy - h * 0.08f)
            close()
        }, paint)
        paint.color = Color.rgb(255, 214, 110)
        canvas.drawRect(hx + w * 0.015f, hy - h * 0.06f, hx + w * 0.035f, hy - h * 0.035f, paint)
        canvas.drawRect(hx + w * 0.075f, hy - h * 0.06f, hx + w * 0.095f, hy - h * 0.035f, paint)
        paint.color = Color.rgb(84, 56, 40)
        canvas.drawRect(hx + w * 0.045f, hy - h * 0.045f, hx + w * 0.065f, hy, paint)

        // Flowers in the foreground
        val petals = intArrayOf(
            Color.rgb(230, 60, 70), Color.rgb(250, 210, 60),
            Color.rgb(245, 245, 240), Color.rgb(170, 90, 200)
        )
        for (i in 0 until 160) {
            val fx = w * rnd.nextFloat()
            val fy = h * (0.84f + 0.16f * rnd.nextFloat())
            val r = 3f + 6f * rnd.nextFloat() * (fy / h)
            paint.color = petals[rnd.nextInt(petals.size)]
            canvas.drawCircle(fx, fy, r, paint)
        }
        return bmp
    }
}
