# Artisan NPR Studio: Technical Audit

Date: 2026-10-17 · Source: `npr_studio_master_project_blueprint.md`

> **Status (2026-10-17, later the same day):**
> - **Fixed:** F1–F4 (smear compile error, error checks, long-lived GL thread renderer, render queue); C1–C4; H3–H6; M1–M3, M5, M7, M8; L2.
> - **Fixed differently from F7:** instead of multi-pass, shaders read pre-blurred mipmap levels and size everything in "preview pixels" (`uScale`). Tap counts stay flat at any export size, and the preview matches the export (H1, H2). Average render: 13 ms at 1280 px on a Mali-G720.
> - **Still open:** F6 (decode/save hardening; minSdk is now 29, so the crashes are gone) and true multi-pass effects such as a smoothed structure-tensor flow.
>
> The 8 blueprint shaders were rewritten into a 134-shader library (see README).

## Verdict

**Do not build features on this code yet.**

The stack is the right choice: Kotlin, Compose, and OpenGL ES 3.0 offscreen rendering, all offline. I found **no made-up Android or GL APIs**. Every call exists with the signature used. The code itself is the problem:

- One shader does not compile, and nothing checks for it, so you just get a black image.
- The renderer rebuilds the whole GPU context on every slider move, on random threads. Scrubbing cannot work like that.
- The app crashes on Android 8 and 9, even though it claims to support them.
- Several effects do not do what the document says they do.

All of this can be fixed. The fixes are listed below in the order to do them.

## What I actually checked

| Check | How | Result |
|---|---|---|
| All 9 shaders compile | `glslc` from NDK 28 (glslang). The version line was bumped to `310 es` only because glslc needs it. The type rules are the same. | **8 pass, 1 fails** (`SMEAR_PAINT`) |
| My shader fixes below compile | Same tool | All pass |
| Flow-direction formula (F7) | Python check on edge cases | Perpendicular to the gradient in every case, including the ones a naive formula gets wrong |
| Kotlin / Gradle | **Read only, not compiled.** There is no project yet. | See issues |

The exact compiler error:

```
smear_paint.frag:50: error: '*' : wrong operand types: no operation '*' exists that takes
a left-hand operand of type 'mediump int' and a right operand of type 'const float'
```

---

## Ranked issues

### Critical: blocks a working app

| # | Issue | Where | Fix |
|---|---|---|---|
| C1 | **Smear shader does not compile.** `float(steps * steps * 0.5)` multiplies an int by a float, which GLSL ES does not allow. Compile and link status are never checked, so the result is a silent black image. | `SMEAR_PAINT_SHADER`, `compileShader()` | F1, F2 |
| C2 | **Render threading is broken.** `render()` blocks and ignores cancellation, so `renderJob?.cancel()` does not stop it. While scrubbing, old renders keep running side by side on the `Default` pool. They share `vertexBuffer` and fight over `position()`. A slow old result can land **after** a newer one, so the slider says 80% while the image shows 40%. `_uiState.value = _uiState.value.copy(...)` runs on several threads and drops updates. | `NprViewModel.triggerPreviewRender()` | F3, F4 |
| C3 | **Rebuilding EGL every call rules out slider scrubbing.** Each slider tick does all of this: create the context, compile and link the shader, make a full-size pbuffer, upload the texture, draw, `glReadPixels` (which stalls the GPU), allocate about 20 MB of fresh buffers, then destroy everything. Because the context lives on whichever pool thread happened to run, it cannot be cached either. | `EglOffscreenRenderer.render()` | F3 |
| C4 | **Crashes on Android 8 and 9 (minSdk 26).** `ImageDecoder` needs API 28, so loading a photo crashes on 8.0 and 8.1. On API 26–28, `MediaStore` insert needs `WRITE_EXTERNAL_STORAGE`, which the app never requests. It throws `SecurityException`, and the `insert` call sits **outside** the `try`, so export crashes. | `BitmapRepository` | F6 |

### High

| # | Issue | Where | Fix |
|---|---|---|---|
| H1 | **The shaders are far too heavy.** Every blur is a full 2D loop. See the table below. At the maximum setting, pencil does about **1.03 billion texture reads per update** at 1280×960 and about 6.5 billion at 3200×2400. One export draw can run for seconds, and Android GPU drivers can reset the GPU on long jobs. The result is a lost context or a black output. | All blur-type shaders | F7 |
| H2 | **The preview does not match the export.** Every size is in pixels: blur radius, hatch spacing, dot size, grain. The 3200 px export looks about 2.5× finer than the 1280 px preview, and pointillism dots shrink to noise. | All shaders | F7 (`uScale`) |
| H3 | **The project will not build as given.** `settings.gradle.kts`, the root build file, and `gradle.properties` are missing. `android.useAndroidX=true` is required with these dependencies. `composeOptions 1.5.14` ties you to Kotlin 1.9.24; on Kotlin 2.x you must use the Compose compiler Gradle plugin instead. | Build files | F8 |
| H4 | **No error handling.** Nothing checks `configs[0]!!`, `eglCreateContext`, or `eglMakeCurrent`, and there is no `try/finally`. Any failure leaves the context alive and current on a pool thread. A bad photo makes `decodeBitmap` throw inside `viewModelScope`, and the app crashes. | Renderer, ViewModel | F2–F4 |
| H5 | **The "structure tensor" is not implemented.** The code only turns the raw Sobel gradient by 90°. Without the smoothing step (G_ρ ∗ J), the tensor adds nothing over the gradient, so the flow is noisy. The streamline walker also never fixes sign flips (t and −t), so a streamline can bounce back and forth on the spot. | `SMEAR_PAINT_SHADER` | F1 (quick), F7 (proper) |
| H6 | **Pointillism dots get cut off at cell borders.** The radius goes up to 0.85 cell, but only the pixel's own cell is checked, so a square grid shows through. `smoothstep(radius + 0.08, radius - 0.08, d)` passes its edges in reverse order, which GLSL leaves **undefined**. | `POINTILLISM_SHADER` | F5 |

Texture reads per output pixel at the maximum slider setting (counted from the code):

| Effect | Reads / pixel | Why |
|---|---|---|
| Pencil | 842 | 29×29 2D Gaussian |
| Smear | ~513 | 28 steps × 2 directions × (8 Sobel + 1 colour) |
| Kuwahara | 484 | 4 × 11×11 quadrants |
| XDoG | 441 | 21×21 2D, two Gaussians |
| Impasto | 384 | Kuwahara recomputed **3×** (centre, right, down) |
| Watercolor | 294 | 17×17 2D bilateral |
| Cross-hatch / Pointillism | 1 | Fine |

### Medium

| # | Issue | Fix |
|---|---|---|
| M1 | The EGL config asks for `EGL_OPENGL_ES2_BIT` but then creates an ES 3 context. That works on most drivers but is not guaranteed. Use `EGLExt.EGL_OPENGL_ES3_BIT_KHR`. | F3 |
| M2 | XDoG's `tanh` gets very large negative inputs: with τ = 35 and φ = 12 the argument reaches about −430. Some mobile drivers return NaN for that. Clamp it. | F5 |
| M3 | The Activity `Context` is passed into ViewModel coroutines (`loadPhoto`, `exportHighRes`). Rotating the screen during an export leaks the Activity. | F4 |
| M4 | **Export memory peaks around 300 MB** (math below). `GL_MAX_TEXTURE_SIZE` is never checked: ES 3.0 only promises 2048, and some older GPUs top out at 4096. | F3, F7 |
| M5 | The CPU Sobel pass never writes the outer 1-pixel border, so the edge comes out transparent black. It is also the slowest step and should be a GPU pass. | F5 |
| M6 | Watercolor takes its edge darkening from the **original** photo, which puts fine detail back into the flat wash. It quantizes RGB, not chroma as the doc says, which shifts hues. The "Perlin/simplex" grain and "morphological" darkening the doc describes are not in the code. | F7 |
| M7 | `targetSdk 35` forces edge-to-edge on Android 15, so the custom top-bar `Row` draws under the status bar. | `Modifier.statusBarsPadding()` or `TopAppBar` |
| M8 | `eglTerminate()` on every render closes the default display, which the UI renderer shares. It is pointless and risky, so drop it. | F3 |

### Low

| # | Issue |
|---|---|
| L1 | The pencil Gaussian is cut off at about 1.6σ, so the blur looks boxy. Inverting and dodging is the same as `Y / blur(Y)`, so the extra inversion can go. |
| L2 | Cross-hatch uses hard thresholds, which gives jagged lines and visible bands. Ink covers 56–77% of each stripe, so it reads as dark fill with white lines. "Ink Darkness 0%" gives a blank page. |
| L3 | The doc says Impasto uses Phong lighting and a 4-quadrant Kuwahara. The code uses **Blinn-Phong** and a **2-quadrant** Kuwahara, which leaves diagonal artefacts. |
| L4 | Display P3 (wide-colour) photos are not converted to sRGB, so colours shift. `raw.copy()` doubles the memory, and `raw` is never recycled. |
| L5 | The save code ignores the `compress()` result. A failed save leaves an empty pending entry in the gallery. PNG at 7.7 MP is slow and large, so offer JPEG or WebP too. |
| L6 | Release builds do not turn on R8 shrinking, so the "3.8 MB APK" claim will not hold. |

---

## Does the math match the literature?

| Engine | Doc math | Code vs doc |
|---|---|---|
| Pencil (colour dodge) | ✅ Correct. It reduces to `Y / blur(Y)`. | ✅ Matches, but the blur is cut off (L1). |
| XDoG | ✅ Correct: Winnemöller, Kyprianidis & Olsen 2012, k = 1.6 | ✅ Matches. It is the isotropic version, not flow-based FDoG, so lines are noisier. |
| Kuwahara | ✅ Correct classic form (overlapping quadrants, minimum-variance mean) | ✅ Matches |
| Structure tensor + LIC | ⚠️ **Incomplete.** The key step, smoothing J with G_ρ before taking eigenvectors, is missing. The LIC integral itself (Cabral & Leedom 1993) is fine. | ❌ No tensor is built, and the streamline can reverse (H5). |
| Bilateral watercolor | ✅ The bilateral formula (Tomasi & Manduchi 1998) is correct. | ⚠️ The bilateral part matches. The "Perlin", "morphological" and "chroma" parts are not implemented (M6). |
| Cross-hatching | A procedural pattern, not a published method. That is fine for an app. | ✅ Matches, with quality issues (L2) |
| Pointillism | It is called "Voronoi" but is really a jittered grid with no neighbour search. | ❌ Dots are clipped (H6) |
| Impasto | ✅ The Phong formula is fine. | ⚠️ The code uses Blinn-Phong and a 2-quadrant Kuwahara (L3). |

## Claims check

| Claim in the blueprint | Reality |
|---|---|
| "60 FPS interactive previews" | ❌ Not with this design (C3, H1). My rough estimate is hundreds of ms per tick at high settings on a mid-tier GPU; I have not measured it. |
| "Process full 12 MP+ images" | ❌ The code caps at 3200 px (7.7 MP), and long single draws risk a GPU reset. |
| "Cancels any in-flight render" | ❌ Cancellation is cooperative, and `render()` never checks for it (C2). |
| "Deterministically destroys … to prevent leaks" | ❌ Only when nothing fails (H4). |
| "Zero legacy storage permissions" | ⚠️ True on Android 10+. Saving crashes on 8 and 9 (C4). |
| "Decode into mutable ARGB_8888" | ❌ `copy(…, false)` makes the bitmap **immutable**. |
| "API 26+ = 99.5% of devices" | ⚠️ Not verified, and it looks high. Check Android Studio's current distribution chart. |
| "≈ 3.8 MB APK" | ⚠️ Only possible with R8 turned on, which it is not (L6). |
| "press-and-hold split comparison" | ⚠️ It swaps the whole image; there is no split view. |

## Memory: is it realistic on a mid-tier phone?

One RGBA buffer takes **4.9 MB at 1280×960** and **30.7 MB at 3200×2400**. On phones the GPU uses ordinary system RAM, so GPU buffers count too.

**Current export peak at 3200×2400:**

| Item | Size |
|---|---|
| Decoded image + `copy()` | 61 MB |
| GL source texture + full-size pbuffer | 61 MB |
| Direct read buffer + output bitmap | 61 MB |
| CPU pass: 2 × `IntArray` + `FloatArray` (Java heap) + result bitmap | 123 MB |
| **Total** | **~307 MB**, plus preview state and the PNG encoder |

**After the fixes:** about **150 MB** (source texture, two FBO textures, read buffer, output; the CPU pass moves to the GPU). That is fine on a 4 GB phone. `largeHeap` should not be needed.

**Preview, current code:** about 20 MB of new allocations per slider tick (35 MB with the CPU pass), and several ticks can be in flight at once. **After the fixes:** close to zero, because buffers are reused.

**Resolution targets:** 1280 for preview and 3200 for export are both realistic once the shaders are separable. Cap export at `min(3200, GL_MAX_TEXTURE_SIZE)`.

---

## Fixes

### F1. Smear shader: compile fix and consistent direction (compiles)

Replace `main()` in `SMEAR_PAINT_SHADER`:

```glsl
void main() {
    int steps = int(mix(6.0, 28.0, uParam1));
    float stepScale = mix(1.0, 2.5, uParam2);
    float twoSigmaSq = float(steps * steps) * 0.5;          // FIX: was int * float

    vec2 dir0 = getFlowVector(vTexCoord);
    vec2 posF = vTexCoord, posB = vTexCoord;
    vec2 prevF = dir0, prevB = -dir0;
    vec3 accum = texture(uTexture, vTexCoord).rgb;
    float total = 1.0;

    for (int i = 1; i <= steps; i++) {
        float w = exp(-float(i * i) / twoSigmaSq);
        vec2 dF = getFlowVector(posF);
        vec2 dB = getFlowVector(posB);
        if (dot(dF, prevF) < 0.0) dF = -dF;                 // FIX: keep walking the same way
        if (dot(dB, prevB) < 0.0) dB = -dB;
        prevF = dF; prevB = dB;
        posF += dF * uTexelSize * stepScale;
        posB += dB * uTexelSize * stepScale;
        accum += (texture(uTexture, posF).rgb + texture(uTexture, posB).rgb) * w;
        total += 2.0 * w;
    }
    vec3 smeared = accum / total;
    float bristle = sin(dot(vTexCoord / uTexelSize, vec2(-dir0.y, dir0.x)) * 1.4);
    fragColor = vec4(clamp(smeared + bristle * uParam3 * 0.06, 0.0, 1.0), 1.0);
}
```

### F2. Check compile and link status

```kotlin
private fun compileShader(type: Int, source: String): Int {
    val shader = GLES30.glCreateShader(type)
    GLES30.glShaderSource(shader, source)
    GLES30.glCompileShader(shader)
    val ok = IntArray(1)
    GLES30.glGetShaderiv(shader, GLES30.GL_COMPILE_STATUS, ok, 0)
    if (ok[0] == 0) {
        val log = GLES30.glGetShaderInfoLog(shader)
        GLES30.glDeleteShader(shader)
        throw IllegalStateException("Shader compile failed:\n$log")
    }
    return shader
}

private fun linkProgram(vertexSrc: String, fragmentSrc: String): Int {
    val vs = compileShader(GLES30.GL_VERTEX_SHADER, vertexSrc)
    val fs = compileShader(GLES30.GL_FRAGMENT_SHADER, fragmentSrc)
    val program = GLES30.glCreateProgram()
    GLES30.glAttachShader(program, vs)
    GLES30.glAttachShader(program, fs)
    GLES30.glLinkProgram(program)
    GLES30.glDeleteShader(vs)   // freed together with the program
    GLES30.glDeleteShader(fs)
    val ok = IntArray(1)
    GLES30.glGetProgramiv(program, GLES30.GL_LINK_STATUS, ok, 0)
    if (ok[0] == 0) {
        val log = GLES30.glGetProgramInfoLog(program)
        GLES30.glDeleteProgram(program)
        throw IllegalStateException("Program link failed:\n$log")
    }
    return program
}

private fun checkGl(op: String) {
    val err = GLES30.glGetError()
    check(err == GLES30.GL_NO_ERROR) { "$op: GL error 0x${Integer.toHexString(err)}" }
}

private fun eglError() = "0x" + Integer.toHexString(EGL14.eglGetError())
```

Also add the `glslc` check I used to CI, so this kind of error is caught before anything runs on a device.

### F3. Replace `EglOffscreenRenderer` with a long-lived renderer on one GL thread

The design: one EGL context on one dedicated thread, created once. Shaders compile once and are cached. The source image uploads once per photo. A slider move then only sets uniforms and draws. Output goes into an FBO texture, which allows any size and multi-pass effects.

```kotlin
package com.artisan.nprstudio.engine

import android.graphics.Bitmap
import android.opengl.EGL14
import android.opengl.EGLConfig
import android.opengl.EGLExt
import android.opengl.GLES30
import android.opengl.GLUtils
import com.artisan.nprstudio.model.NprFilterConfig
import com.artisan.nprstudio.model.NprStyle
import kotlinx.coroutines.asCoroutineDispatcher
import kotlinx.coroutines.withContext
import java.nio.ByteBuffer
import java.nio.ByteOrder
import java.util.concurrent.Executors

class GlRenderer : AutoCloseable {

    // EGL contexts are bound to ONE thread. Every GL call goes through this dispatcher.
    private val executor = Executors.newSingleThreadExecutor { Thread(it, "npr-gl") }
    private val glThread = executor.asCoroutineDispatcher()

    private var display = EGL14.EGL_NO_DISPLAY
    private var context = EGL14.EGL_NO_CONTEXT
    private var surface = EGL14.EGL_NO_SURFACE

    private val programs = HashMap<NprStyle, Int>()
    private var vao = 0
    private var srcTex = 0
    private var dstTex = 0
    private var fbo = 0
    private var width = 0
    private var height = 0
    private var readBuffer: ByteBuffer? = null

    var maxTextureSize = 0
        private set

    suspend fun setSource(bitmap: Bitmap) = withContext(glThread) {
        ensureEgl()
        require(bitmap.width <= maxTextureSize && bitmap.height <= maxTextureSize) {
            "${bitmap.width}x${bitmap.height} is over GL_MAX_TEXTURE_SIZE ($maxTextureSize)"
        }
        if (srcTex == 0) srcTex = newTexture()
        GLES30.glBindTexture(GLES30.GL_TEXTURE_2D, srcTex)
        GLUtils.texImage2D(GLES30.GL_TEXTURE_2D, 0, bitmap, 0)
        resizeTarget(bitmap.width, bitmap.height)
        checkGl("setSource")
    }

    suspend fun render(config: NprFilterConfig): Bitmap = withContext(glThread) {
        check(srcTex != 0) { "setSource() first" }
        val program = programs.getOrPut(config.style) {
            linkProgram(ShaderLibrary.VERTEX_SHADER, ShaderLibrary.getFragmentShader(config.style))
        }
        GLES30.glBindFramebuffer(GLES30.GL_FRAMEBUFFER, fbo)
        GLES30.glViewport(0, 0, width, height)
        GLES30.glUseProgram(program)
        GLES30.glActiveTexture(GLES30.GL_TEXTURE0)
        GLES30.glBindTexture(GLES30.GL_TEXTURE_2D, srcTex)
        GLES30.glUniform1i(GLES30.glGetUniformLocation(program, "uTexture"), 0)
        GLES30.glUniform2f(GLES30.glGetUniformLocation(program, "uTexelSize"), 1f / width, 1f / height)
        GLES30.glUniform1f(GLES30.glGetUniformLocation(program, "uParam1"), config.param1)
        GLES30.glUniform1f(GLES30.glGetUniformLocation(program, "uParam2"), config.param2)
        GLES30.glUniform1f(GLES30.glGetUniformLocation(program, "uParam3"), config.param3)
        GLES30.glBindVertexArray(vao)

        // Draw in bands so no single GPU job runs long enough to trip the driver watchdog.
        GLES30.glEnable(GLES30.GL_SCISSOR_TEST)
        for (y in 0 until height step 256) {
            GLES30.glScissor(0, y, width, minOf(256, height - y))
            GLES30.glDrawArrays(GLES30.GL_TRIANGLE_STRIP, 0, 4)
            GLES30.glFlush()
        }
        GLES30.glDisable(GLES30.GL_SCISSOR_TEST)
        checkGl("draw ${config.style}")

        val buf = readBuffer!!
        buf.rewind()
        GLES30.glReadPixels(0, 0, width, height, GLES30.GL_RGBA, GLES30.GL_UNSIGNED_BYTE, buf)
        checkGl("glReadPixels")
        buf.rewind()
        Bitmap.createBitmap(width, height, Bitmap.Config.ARGB_8888).apply { copyPixelsFromBuffer(buf) }
    }

    /** Frees GL on its own thread, then stops the thread. Safe to call from onCleared(). */
    override fun close() {
        executor.execute { releaseEgl() }
        executor.shutdown()
    }

    private fun ensureEgl() {
        if (context != EGL14.EGL_NO_CONTEXT) return
        try {
            display = EGL14.eglGetDisplay(EGL14.EGL_DEFAULT_DISPLAY)
            check(display != EGL14.EGL_NO_DISPLAY) { "eglGetDisplay failed" }
            val version = IntArray(2)
            check(EGL14.eglInitialize(display, version, 0, version, 1)) { "eglInitialize ${eglError()}" }

            val attribs = intArrayOf(
                EGL14.EGL_RED_SIZE, 8, EGL14.EGL_GREEN_SIZE, 8,
                EGL14.EGL_BLUE_SIZE, 8, EGL14.EGL_ALPHA_SIZE, 8,
                EGL14.EGL_RENDERABLE_TYPE, EGLExt.EGL_OPENGL_ES3_BIT_KHR,   // was ES2_BIT
                EGL14.EGL_SURFACE_TYPE, EGL14.EGL_PBUFFER_BIT,
                EGL14.EGL_NONE
            )
            val configs = arrayOfNulls<EGLConfig>(1)
            val count = IntArray(1)
            check(EGL14.eglChooseConfig(display, attribs, 0, configs, 0, 1, count, 0) && count[0] > 0) {
                "No ES 3.0 pbuffer config ${eglError()}"
            }
            val config = configs[0]!!

            context = EGL14.eglCreateContext(
                display, config, EGL14.EGL_NO_CONTEXT,
                intArrayOf(EGL14.EGL_CONTEXT_CLIENT_VERSION, 3, EGL14.EGL_NONE), 0
            )
            check(context != EGL14.EGL_NO_CONTEXT) { "eglCreateContext ${eglError()}" }

            // 1x1 dummy surface: real output goes to an FBO, so its size never matters.
            surface = EGL14.eglCreatePbufferSurface(
                display, config, intArrayOf(EGL14.EGL_WIDTH, 1, EGL14.EGL_HEIGHT, 1, EGL14.EGL_NONE), 0
            )
            check(surface != EGL14.EGL_NO_SURFACE) { "eglCreatePbufferSurface ${eglError()}" }
            check(EGL14.eglMakeCurrent(display, surface, surface, context)) { "eglMakeCurrent ${eglError()}" }

            val max = IntArray(1)
            GLES30.glGetIntegerv(GLES30.GL_MAX_TEXTURE_SIZE, max, 0)
            maxTextureSize = max[0]
            vao = createQuad()
        } catch (t: Throwable) {
            releaseEgl()
            throw t
        }
    }

    private fun releaseEgl() {
        if (display == EGL14.EGL_NO_DISPLAY) return
        EGL14.eglMakeCurrent(display, EGL14.EGL_NO_SURFACE, EGL14.EGL_NO_SURFACE, EGL14.EGL_NO_CONTEXT)
        if (surface != EGL14.EGL_NO_SURFACE) EGL14.eglDestroySurface(display, surface)
        if (context != EGL14.EGL_NO_CONTEXT) EGL14.eglDestroyContext(display, context) // frees all GL objects
        EGL14.eglReleaseThread()
        // No eglTerminate: the default display is shared with the app's UI renderer.
        display = EGL14.EGL_NO_DISPLAY
        context = EGL14.EGL_NO_CONTEXT
        surface = EGL14.EGL_NO_SURFACE
        programs.clear()
        vao = 0; srcTex = 0; dstTex = 0; fbo = 0; width = 0; height = 0; readBuffer = null
    }

    private fun createQuad(): Int {
        val quad = floatArrayOf(-1f, -1f, 0f, 0f, 1f, -1f, 1f, 0f, -1f, 1f, 0f, 1f, 1f, 1f, 1f, 1f)
        val data = ByteBuffer.allocateDirect(quad.size * 4).order(ByteOrder.nativeOrder())
            .asFloatBuffer().apply { put(quad); position(0) }
        val ids = IntArray(2)
        GLES30.glGenVertexArrays(1, ids, 0)
        GLES30.glGenBuffers(1, ids, 1)
        GLES30.glBindVertexArray(ids[0])
        GLES30.glBindBuffer(GLES30.GL_ARRAY_BUFFER, ids[1])
        GLES30.glBufferData(GLES30.GL_ARRAY_BUFFER, quad.size * 4, data, GLES30.GL_STATIC_DRAW)
        GLES30.glVertexAttribPointer(0, 2, GLES30.GL_FLOAT, false, 16, 0)
        GLES30.glEnableVertexAttribArray(0)
        GLES30.glVertexAttribPointer(1, 2, GLES30.GL_FLOAT, false, 16, 8)
        GLES30.glEnableVertexAttribArray(1)
        GLES30.glBindVertexArray(0)
        return ids[0]
    }

    private fun resizeTarget(w: Int, h: Int) {
        if (w == width && h == height && fbo != 0) return
        if (dstTex == 0) dstTex = newTexture()
        GLES30.glBindTexture(GLES30.GL_TEXTURE_2D, dstTex)
        GLES30.glTexImage2D(
            GLES30.GL_TEXTURE_2D, 0, GLES30.GL_RGBA8, w, h, 0,
            GLES30.GL_RGBA, GLES30.GL_UNSIGNED_BYTE, null
        )
        if (fbo == 0) fbo = IntArray(1).also { GLES30.glGenFramebuffers(1, it, 0) }[0]
        GLES30.glBindFramebuffer(GLES30.GL_FRAMEBUFFER, fbo)
        GLES30.glFramebufferTexture2D(
            GLES30.GL_FRAMEBUFFER, GLES30.GL_COLOR_ATTACHMENT0, GLES30.GL_TEXTURE_2D, dstTex, 0
        )
        check(GLES30.glCheckFramebufferStatus(GLES30.GL_FRAMEBUFFER) == GLES30.GL_FRAMEBUFFER_COMPLETE) {
            "FBO incomplete"
        }
        width = w; height = h
        readBuffer = ByteBuffer.allocateDirect(w * h * 4).order(ByteOrder.nativeOrder())
    }

    private fun newTexture(): Int {
        val id = IntArray(1).also { GLES30.glGenTextures(1, it, 0) }[0]
        GLES30.glBindTexture(GLES30.GL_TEXTURE_2D, id)
        GLES30.glTexParameteri(GLES30.GL_TEXTURE_2D, GLES30.GL_TEXTURE_MIN_FILTER, GLES30.GL_LINEAR)
        GLES30.glTexParameteri(GLES30.GL_TEXTURE_2D, GLES30.GL_TEXTURE_MAG_FILTER, GLES30.GL_LINEAR)
        GLES30.glTexParameteri(GLES30.GL_TEXTURE_2D, GLES30.GL_TEXTURE_WRAP_S, GLES30.GL_CLAMP_TO_EDGE)
        GLES30.glTexParameteri(GLES30.GL_TEXTURE_2D, GLES30.GL_TEXTURE_WRAP_T, GLES30.GL_CLAMP_TO_EDGE)
        return id
    }

    // + compileShader / linkProgram / checkGl / eglError from F2
}
```

Image orientation: texture row 0 is the bitmap's top row, and `glReadPixels` row 0 goes back to the top. The two flips cancel, so no flip code is needed. The original code got this right too.

### F4. ViewModel: one render queue, newest request wins, no stale images

```kotlin
class NprViewModel(app: Application) : AndroidViewModel(app) {   // app context: no Activity leak

    private val _uiState = MutableStateFlow(NprUiState())
    val uiState: StateFlow<NprUiState> = _uiState.asStateFlow()

    private val renderer = GlRenderer()
    private var currentUri: Uri? = null

    // sourceId changes with every new photo, so the same config still re-renders.
    private data class RenderRequest(val config: NprFilterConfig, val sourceId: Int)
    private val requests = MutableStateFlow<RenderRequest?>(null)
    private var sourceId = 0

    init {
        viewModelScope.launch {
            // A new request cancels waiting for the old one. withContext() drops the
            // result of a cancelled call, so a stale image is never shown.
            requests.filterNotNull().collectLatest { renderPreview(it.config) }
        }
        viewModelScope.launch { setSource(BitmapRepository.generateSampleLandscape()) }
    }

    fun loadPhoto(uri: Uri) {
        viewModelScope.launch {
            try {
                val bmp = withContext(Dispatchers.IO) {
                    BitmapRepository.loadAndScaleBitmap(getApplication(), uri, maxDimension = 1280)
                }
                currentUri = uri
                setSource(bmp)
            } catch (e: CancellationException) {
                throw e
            } catch (e: Exception) {
                _uiState.update { it.copy(statusMessage = "Could not open that photo") }
            }
        }
    }

    fun updateStyle(style: NprStyle) = updateConfig { it.copy(style = style) }

    fun updateParams(
        param1: Float = _uiState.value.config.param1,
        param2: Float = _uiState.value.config.param2,
        param3: Float = _uiState.value.config.param3,
        useCpuRefinement: Boolean = _uiState.value.config.useCpuRefinement
    ) = updateConfig { it.copy(param1 = param1, param2 = param2, param3 = param3, useCpuRefinement = useCpuRefinement) }

    private fun updateConfig(change: (NprFilterConfig) -> NprFilterConfig) {
        val next = _uiState.updateAndGet { it.copy(config = change(it.config)) }.config
        requests.value = RenderRequest(next, sourceId)
    }

    private suspend fun setSource(bmp: Bitmap) {
        renderer.setSource(bmp)
        sourceId++
        _uiState.update { it.copy(sourcePreview = bmp) }
        requests.value = RenderRequest(_uiState.value.config, sourceId)
    }

    private suspend fun renderPreview(config: NprFilterConfig) {
        _uiState.update { it.copy(isProcessing = true) }
        try {
            var out = renderer.render(config)
            if (config.useCpuRefinement) {
                out = withContext(Dispatchers.Default) { CpuMathEngine.applySobelInkOverlay(out, 0.65f) }
            }
            _uiState.update { it.copy(renderedPreview = out, isProcessing = false) }
        } catch (e: CancellationException) {
            throw e
        } catch (e: Exception) {
            _uiState.update { it.copy(isProcessing = false, statusMessage = "Render failed: ${e.message}") }
        }
    }

    fun exportHighRes() {
        val config = _uiState.value.config
        val uri = currentUri
        viewModelScope.launch {
            _uiState.update { it.copy(isProcessing = true, statusMessage = "Rendering high-res art…") }
            val saved = try {
                GlRenderer().use { exporter ->          // own context, so the preview keeps working
                    val src = withContext(Dispatchers.IO) {
                        uri?.let { BitmapRepository.loadAndScaleBitmap(getApplication(), it, 3200) }
                    } ?: _uiState.value.sourcePreview!!
                    exporter.setSource(src)              // throws if over GL_MAX_TEXTURE_SIZE
                    var out = exporter.render(config)
                    if (config.useCpuRefinement) {
                        out = withContext(Dispatchers.Default) { CpuMathEngine.applySobelInkOverlay(out, 0.65f) }
                    }
                    withContext(Dispatchers.IO) {
                        BitmapRepository.saveBitmapToGallery(getApplication(), out, config.style.name)
                    }
                }
            } catch (e: CancellationException) {
                throw e
            } catch (e: Exception) {
                false
            }
            _uiState.update {
                it.copy(isProcessing = false, statusMessage = if (saved) "Saved to Pictures/ArtisanNPR" else "Export failed")
            }
        }
    }

    override fun onCleared() = renderer.close()
}
```

In `MainActivity`, call `viewModel.loadPhoto(it)` and `viewModel.exportHighRes()` (no `context` argument), and add `Modifier.statusBarsPadding()` to the top-bar `Row`.

### F5. Smaller shader fixes (all compile)

**Pointillism:** check the 3×3 neighbouring cells, and fix the `smoothstep` order:

```glsl
void main() {
    float cellScale = mix(8.0, 3.0, uParam1);          // later: * uScale (F7)
    float maxRad = mix(0.45, 0.85, uParam2);
    float levels = mix(16.0, 5.0, uParam3);
    vec2 p = (vTexCoord / uTexelSize) / cellScale;     // position in cell units
    vec2 cell = floor(p);
    vec3 col = vec3(0.95, 0.93, 0.88);

    for (int y = -1; y <= 1; y++) {
        for (int x = -1; x <= 1; x++) {
            vec2 g = cell + vec2(float(x), float(y));
            vec2 jitter = vec2(hash12(g), hash12(g + 17.3)) - 0.5;
            vec2 center = g + 0.5 + jitter * 0.4;      // same point for colour and dot
            vec3 paint = texture(uTexture, clamp(center * cellScale * uTexelSize, 0.0, 1.0)).rgb;
            paint = floor(paint * levels + 0.5) / levels;
            float radius = mix(maxRad, maxRad * 0.4, getLuma(paint));
            float d = length(p - center);
            float aa = fwidth(d);
            float mask = 1.0 - smoothstep(radius - aa, radius + aa, d);   // edge0 < edge1
            col = mix(col, paint, mask);
        }
    }
    fragColor = vec4(col, 1.0);
}
```

**XDoG:** clamp the `tanh` input:

```glsl
float edge = (dog >= eps) ? 1.0 : 1.0 + tanh(max(phi * (dog - eps), -10.0));
```

**CPU Sobel border (until it moves to the GPU):** add `inPixels.copyInto(outPixels)` before the loop.

### F6. Android 8 and 9 crashes and safe saving

**Recommended:** set `minSdk = 29` (Android 10). That removes both crashes, with no fallback code and no storage permission needed.

If you must keep 26, you need a `BitmapFactory` fallback for API < 28 that reads EXIF rotation itself, plus `<uses-permission android:name="android.permission.WRITE_EXTERNAL_STORAGE" android:maxSdkVersion="28"/>` and a runtime permission prompt.

Safer decode and save (written for minSdk 29):

```kotlin
fun loadAndScaleBitmap(context: Context, uri: Uri, maxDimension: Int): Bitmap {
    val source = ImageDecoder.createSource(context.contentResolver, uri)
    val raw = ImageDecoder.decodeBitmap(source) { decoder, info, _ ->
        decoder.allocator = ImageDecoder.ALLOCATOR_SOFTWARE          // GL can't read HARDWARE bitmaps
        decoder.setTargetColorSpace(ColorSpace.get(ColorSpace.Named.SRGB))
        val w = info.size.width
        val h = info.size.height
        if (w > maxDimension || h > maxDimension) {
            val s = min(maxDimension.toFloat() / w, maxDimension.toFloat() / h)
            decoder.setTargetSize((w * s).roundToInt().coerceAtLeast(1), (h * s).roundToInt().coerceAtLeast(1))
        }
    }
    if (raw.config == Bitmap.Config.ARGB_8888) return raw
    return raw.copy(Bitmap.Config.ARGB_8888, false).also { raw.recycle() }
}

fun saveBitmapToGallery(context: Context, bitmap: Bitmap, title: String): Boolean {
    val values = ContentValues().apply {
        put(MediaStore.Images.Media.DISPLAY_NAME, "ArtisanNPR_${title}_${System.currentTimeMillis()}.png")
        put(MediaStore.Images.Media.MIME_TYPE, "image/png")
        put(MediaStore.Images.Media.RELATIVE_PATH, Environment.DIRECTORY_PICTURES + "/ArtisanNPR")
        put(MediaStore.Images.Media.IS_PENDING, 1)
    }
    val resolver = context.contentResolver
    var uri: Uri? = null
    return try {
        val target = resolver.insert(MediaStore.Images.Media.EXTERNAL_CONTENT_URI, values) ?: return false
        uri = target
        val written = resolver.openOutputStream(target)?.use { bitmap.compress(Bitmap.CompressFormat.PNG, 100, it) } ?: false
        check(written) { "compress failed" }
        values.clear()
        values.put(MediaStore.Images.Media.IS_PENDING, 0)
        resolver.update(target, values, null, null)
        true
    } catch (e: Exception) {
        uri?.let { resolver.delete(it, null, null) }           // don't leave a broken pending row
        false
    }
}
```

### F7. Multi-pass pipeline: the real performance fix

The F3 renderer gives you FBOs. Add a second texture so passes can ping-pong between them, and add one uniform to every shader:

```glsl
uniform float uScale;   // = max(width, height) / 1280.0, so preview and export look the same
```

Multiply every size given in pixels by `uScale`: radii, sigmas, cell size, hatch spacing, grain (`hash12(floor(pixel / uScale))`). That only stays affordable with separable passes. At 3200 px a 2D pencil kernel would need about 18,000 reads per pixel; the separable version needs about 270.

**Generic separable Gaussian (compiles).** Run it twice: once with `uDir = (1,0)`, then with `(0,1)`.

```glsl
uniform vec2 uDir;
uniform float uSigma;   // pixels, already * uScale

void main() {
    int r = int(ceil(3.0 * uSigma));
    float a = -0.5 / (uSigma * uSigma);
    vec4 sum = texture(uTexture, vTexCoord);
    float wsum = 1.0;
    for (int i = 1; i <= r; i++) {
        float w = exp(a * float(i * i));
        vec2 o = uDir * uTexelSize * float(i);
        sum += (texture(uTexture, vTexCoord + o) + texture(uTexture, vTexCoord - o)) * w;
        wsum += 2.0 * w;
    }
    fragColor = sum / wsum;
}
```

Later you can halve the reads again with the linear-sampling trick, where one bilinear read covers two taps.

**Real structure tensor for Smear (compiles).**

Pass 1 writes the tensor:

```glsl
// after Sobel gx, gy:
fragColor = vec4(gx * gx, gx * gy, gy * gy, 1.0);   // (E, F, G)
```

Pass 2 smooths it with the Gaussian above, using σ ≈ 2 × `uScale`. Pass 3 runs the LIC, reading the direction from the smoothed tensor. That is 2 reads per step instead of 9.

```glsl
uniform sampler2D uTensor;

vec2 tangentAt(vec2 uv) {
    vec3 J = texture(uTensor, uv).xyz;
    float E = J.x, F = J.y, G = J.z;
    float l1 = 0.5 * (E + G + sqrt((E - G) * (E - G) + 4.0 * F * F));
    vec2 a = vec2(l1 - E, -F);     // two equivalent forms of the minor eigenvector;
    vec2 b = vec2(-F, l1 - G);     // use whichever is not degenerate
    vec2 v = dot(a, a) > dot(b, b) ? a : b;
    float len2 = dot(v, v);
    return len2 > 1e-12 ? v * inversesqrt(len2) : vec2(0.0, 1.0);
}
// main(): the same loop as F1, with getFlowVector() replaced by tangentAt()
```

**Passes per effect:**

| Effect | Passes | Target format |
|---|---|---|
| Pencil | blur RGB H → V → final `Y / max(ε, luma(blurred))`. Blur is linear, so blurring RGB and then taking luma is the same as blurring luma. | RGBA8 is fine |
| XDoG | blur σ and kσ (H → V each) → threshold | **16-bit needed.** τ up to 35 magnifies 8-bit steps about 35×. |
| Smear | tensor → blur → LIC | 16-bit (the values are 0–16 and can be negative) |
| Impasto | Kuwahara → texture → lighting pass (3 reads) | RGBA8 |
| Watercolor | bilateral at half resolution, then edge darkening taken from the **wash**, not the photo | RGBA8 |
| Kuwahara | single pass is fine for now. Later: separable box sums of colour and colour², or anisotropic Kuwahara. | 16-bit for the box-sum version |

**16-bit render targets:** check for `GL_EXT_color_buffer_half_float` or `GL_EXT_color_buffer_float` with `glGetStringi`. Most ES 3.0+ phones have one, and ES 3.2 includes it as standard. Otherwise, pack each value into two 8-bit channels.

### F8. Build setup

- Generate the project skeleton from Android Studio's **Empty Activity (Compose)** template, so the AGP, Kotlin, and Compose versions match each other. Then drop the sources in.
- Use the `org.jetbrains.kotlin.plugin.compose` plugin, and delete `composeOptions`.
- Make sure `gradle.properties` has `android.useAndroidX=true`.
- For release builds, set `isMinifyEnabled = true` and `isShrinkResources = true`.

---

## Fix order

1. **Project skeleton plus a minSdk decision** (F8, F6). I recommend minSdk 29.
2. **Shader safety:** F2 checks, the F1 smear fix, and the `glslc` check as a script or CI step.
3. **Renderer core:** F3 (one GL thread, FBO, cached programs) and F4 (render queue). This is what makes scrubbing possible.
4. **Storage and decode:** the F6 code.
5. **Performance and preview/export match:** F7 multi-pass, `uScale`, and banded export drawing.
6. **Quality:** F5 and the Medium/Low items. Update the blueprint so its claims match the code.
7. **Then measure on a real mid-tier phone.** After that, consider drawing the preview straight to the screen with Compose `AndroidExternalSurface`, which skips the GPU→CPU→GPU round trip for each frame.

With steps 1–5 done, a 1280 px interactive preview and a 3200 px export on a mid-tier phone are realistic. That still has to be confirmed on a device.
