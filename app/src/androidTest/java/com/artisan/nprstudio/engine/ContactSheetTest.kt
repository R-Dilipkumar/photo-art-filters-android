package com.artisan.nprstudio.engine

import android.graphics.Bitmap
import android.graphics.BitmapFactory
import android.graphics.Canvas
import android.graphics.Color
import android.graphics.Paint
import android.graphics.Rect
import android.os.SystemClock
import androidx.test.ext.junit.runners.AndroidJUnit4
import androidx.test.platform.app.InstrumentationRegistry
import com.artisan.nprstudio.model.Finish
import com.artisan.nprstudio.util.BitmapRepository
import kotlinx.coroutines.runBlocking
import org.junit.Assume.assumeTrue
import org.junit.Test
import org.junit.runner.RunWith
import java.io.File

/**
 * Not a pass/fail test: renders every shader into labelled contact sheets and times each
 * one at preview size, for a human to review. Output goes to the app's external files dir:
 *   adb pull /sdcard/Android/data/com.artisan.nprstudio/files/contact
 * Put an optional test photo at .../files/test_photo.jpg first (else the built-in sample).
 */
@RunWith(AndroidJUnit4::class)
class ContactSheetTest {

    private val context = InstrumentationRegistry.getInstrumentation().targetContext
    private val catalog = ShaderCatalog.load(context.assets)
    private val outDir = File(context.getExternalFilesDir(null), "contact").apply {
        deleteRecursively()
        mkdirs()
    }

    @Test
    fun renderContactSheetsAndTimings() = runBlocking {
        // Only when asked for (tools/contact_sheets.sh passes this), not in every test run.
        assumeTrue(InstrumentationRegistry.getArguments().getString("contactSheets") == "true")
        val photo = File(context.getExternalFilesDir(null), "test_photo.jpg")
        val preview = if (photo.exists()) {
            val bounds = BitmapFactory.Options().apply { inJustDecodeBounds = true }
            BitmapFactory.decodeFile(photo.path, bounds)
            var sample = 1
            while (maxOf(bounds.outWidth, bounds.outHeight) / (sample * 2) >= 1280) sample *= 2
            val raw = BitmapFactory.decodeFile(
                photo.path, BitmapFactory.Options().apply { inSampleSize = sample }
            )
            val s = 1280f / maxOf(raw.width, raw.height)
            Bitmap.createScaledBitmap(raw, (raw.width * s).toInt(), (raw.height * s).toInt(), true)
        } else {
            BitmapRepository.generateSampleLandscape()
        }

        GlRenderer(catalog.vertexSource).use { renderer ->
            // 1) Timing at real preview size (1280 px long side).
            renderer.setSource(preview)
            val timings = StringBuilder("shader\tms (1280 px, median of 3)\n")
            for (def in catalog.shaders) {
                val src = catalog.fragmentSource(def)
                renderer.render(def, src, def.defaultValues(), def.defaultColors(), Finish()) // compile + warm up
                val times = (0 until 3).map {
                    val t0 = SystemClock.elapsedRealtimeNanos()
                    renderer.render(def, src, def.defaultValues(), def.defaultColors(), Finish())
                    (SystemClock.elapsedRealtimeNanos() - t0) / 1_000_000
                }.sorted()
                timings.append(def.id).append('\t').append(times[1]).append('\n')
            }
            File(outDir, "timings.tsv").writeText(timings.toString())

            // 2) Contact sheets: render at preview size, then shrink in 2x steps (a box
            //    filter), roughly what the phone screen shows.
            val cellW = preview.width / 4
            val cellH = preview.height / 4
            val labelH = 26
            val cols = 4
            val rows = 5
            val paint = Paint(Paint.ANTI_ALIAS_FLAG).apply { textSize = 17f; color = Color.WHITE }
            val ordered = catalog.categories.flatMap { catalog.inCategory(it) }
            ordered.chunked(cols * rows).forEachIndexed { sheetIndex, chunk ->
                val sheet = Bitmap.createBitmap(cols * cellW, rows * (cellH + labelH), Bitmap.Config.ARGB_8888)
                val canvas = Canvas(sheet)
                canvas.drawColor(Color.rgb(24, 24, 27))
                chunk.forEachIndexed { i, def ->
                    val full = renderer.render(
                        def, catalog.fragmentSource(def), def.defaultValues(), def.defaultColors(), Finish()
                    )
                    val half = Bitmap.createScaledBitmap(full, full.width / 2, full.height / 2, true)
                    val out = Bitmap.createScaledBitmap(half, cellW, cellH, true)
                    val x = (i % cols) * cellW
                    val y = (i / cols) * (cellH + labelH)
                    canvas.drawBitmap(out, null, Rect(x, y, x + cellW, y + cellH), null)
                    canvas.drawText("${def.category}: ${def.name}", x + 5f, y + cellH + 19f, paint)
                }
                File(outDir, "sheet_%02d.png".format(sheetIndex + 1)).outputStream().use {
                    sheet.compress(Bitmap.CompressFormat.PNG, 100, it)
                }
            }
        }
    }
}
