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

/**
 * Offscreen GLES 3.0 renderer that lives for the whole screen session.
 *
 * An EGL context is bound to one thread, so every GL call runs on a single dedicated
 * thread. The context, shaders and source texture are created once; a slider move only
 * sets uniforms and draws. Output goes into an FBO texture, so its size is free and
 * multi-pass effects can be added later.
 */
class GlRenderer : AutoCloseable {

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

    /** Largest texture side this GPU accepts. 0 until the first [setSource]. */
    @Volatile
    var maxTextureSize = 0
        private set

    /** Uploads [bitmap] (must be ARGB_8888, not HARDWARE) as the image every render reads. */
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

    /** Renders the current source with [config] and returns a new bitmap of the same size. */
    suspend fun render(config: NprFilterConfig): Bitmap = withContext(glThread) {
        check(srcTex != 0) { "setSource() must be called first" }
        val program = programs.getOrPut(config.style) {
            linkProgram(ShaderLibrary.VERTEX_SHADER, ShaderLibrary.getFragmentShader(config.style))
        }

        GLES30.glBindFramebuffer(GLES30.GL_FRAMEBUFFER, fbo)
        GLES30.glViewport(0, 0, width, height)
        GLES30.glUseProgram(program)
        GLES30.glActiveTexture(GLES30.GL_TEXTURE0)
        GLES30.glBindTexture(GLES30.GL_TEXTURE_2D, srcTex)
        GLES30.glUniform1i(GLES30.glGetUniformLocation(program, "uTexture"), 0)
        GLES30.glUniform2f(
            GLES30.glGetUniformLocation(program, "uTexelSize"),
            1f / width,
            1f / height
        )
        GLES30.glUniform1f(GLES30.glGetUniformLocation(program, "uParam1"), config.param1)
        GLES30.glUniform1f(GLES30.glGetUniformLocation(program, "uParam2"), config.param2)
        GLES30.glUniform1f(GLES30.glGetUniformLocation(program, "uParam3"), config.param3)
        GLES30.glBindVertexArray(vao)

        // Draw in bands so no single GPU job runs long enough to trip the driver watchdog.
        GLES30.glEnable(GLES30.GL_SCISSOR_TEST)
        for (y in 0 until height step BAND_HEIGHT) {
            GLES30.glScissor(0, y, width, minOf(BAND_HEIGHT, height - y))
            GLES30.glDrawArrays(GLES30.GL_TRIANGLE_STRIP, 0, 4)
            GLES30.glFlush()
        }
        GLES30.glDisable(GLES30.GL_SCISSOR_TEST)
        GLES30.glBindVertexArray(0)
        checkGl("draw ${config.style}")

        // Texture row 0 is the bitmap's top row and glReadPixels row 0 maps back to it,
        // so the two flips cancel and no flip is needed.
        val buf = readBuffer!!
        buf.rewind()
        GLES30.glReadPixels(0, 0, width, height, GLES30.GL_RGBA, GLES30.GL_UNSIGNED_BYTE, buf)
        checkGl("glReadPixels")
        buf.rewind()
        Bitmap.createBitmap(width, height, Bitmap.Config.ARGB_8888).apply {
            copyPixelsFromBuffer(buf)
        }
    }

    /** Frees GL on its own thread, then stops the thread. Safe to call from onCleared(). */
    override fun close() {
        if (executor.isShutdown) return
        executor.execute { releaseEgl() }
        executor.shutdown()
    }

    private fun ensureEgl() {
        if (context != EGL14.EGL_NO_CONTEXT) return
        try {
            display = EGL14.eglGetDisplay(EGL14.EGL_DEFAULT_DISPLAY)
            check(display != EGL14.EGL_NO_DISPLAY) { "eglGetDisplay failed" }
            val version = IntArray(2)
            check(EGL14.eglInitialize(display, version, 0, version, 1)) {
                "eglInitialize ${eglError()}"
            }

            val attribs = intArrayOf(
                EGL14.EGL_RED_SIZE, 8,
                EGL14.EGL_GREEN_SIZE, 8,
                EGL14.EGL_BLUE_SIZE, 8,
                EGL14.EGL_ALPHA_SIZE, 8,
                EGL14.EGL_RENDERABLE_TYPE, EGLExt.EGL_OPENGL_ES3_BIT_KHR,
                EGL14.EGL_SURFACE_TYPE, EGL14.EGL_PBUFFER_BIT,
                EGL14.EGL_NONE
            )
            val configs = arrayOfNulls<EGLConfig>(1)
            val count = IntArray(1)
            check(
                EGL14.eglChooseConfig(display, attribs, 0, configs, 0, 1, count, 0) && count[0] > 0
            ) { "No ES 3.0 pbuffer config ${eglError()}" }
            val eglConfig = configs[0]!!

            context = EGL14.eglCreateContext(
                display,
                eglConfig,
                EGL14.EGL_NO_CONTEXT,
                intArrayOf(EGL14.EGL_CONTEXT_CLIENT_VERSION, 3, EGL14.EGL_NONE),
                0
            )
            check(context != EGL14.EGL_NO_CONTEXT) { "eglCreateContext ${eglError()}" }

            // 1x1 dummy surface: real output goes to an FBO, so its size never matters.
            surface = EGL14.eglCreatePbufferSurface(
                display,
                eglConfig,
                intArrayOf(EGL14.EGL_WIDTH, 1, EGL14.EGL_HEIGHT, 1, EGL14.EGL_NONE),
                0
            )
            check(surface != EGL14.EGL_NO_SURFACE) { "eglCreatePbufferSurface ${eglError()}" }
            check(EGL14.eglMakeCurrent(display, surface, surface, context)) {
                "eglMakeCurrent ${eglError()}"
            }

            val max = IntArray(1)
            GLES30.glGetIntegerv(GLES30.GL_MAX_TEXTURE_SIZE, max, 0)
            maxTextureSize = max[0]
            vao = createQuad()
            checkGl("ensureEgl")
        } catch (t: Throwable) {
            releaseEgl()
            throw t
        }
    }

    private fun releaseEgl() {
        if (display == EGL14.EGL_NO_DISPLAY) return
        EGL14.eglMakeCurrent(
            display, EGL14.EGL_NO_SURFACE, EGL14.EGL_NO_SURFACE, EGL14.EGL_NO_CONTEXT
        )
        if (surface != EGL14.EGL_NO_SURFACE) EGL14.eglDestroySurface(display, surface)
        // Destroying the context frees every GL object it owns.
        if (context != EGL14.EGL_NO_CONTEXT) EGL14.eglDestroyContext(display, context)
        EGL14.eglReleaseThread()
        // No eglTerminate: the default display is shared with the app's UI renderer.
        display = EGL14.EGL_NO_DISPLAY
        context = EGL14.EGL_NO_CONTEXT
        surface = EGL14.EGL_NO_SURFACE
        programs.clear()
        vao = 0
        srcTex = 0
        dstTex = 0
        fbo = 0
        width = 0
        height = 0
        readBuffer = null
    }

    private fun createQuad(): Int {
        val quad = floatArrayOf(
            -1f, -1f, 0f, 0f,
            1f, -1f, 1f, 0f,
            -1f, 1f, 0f, 1f,
            1f, 1f, 1f, 1f
        )
        val data = ByteBuffer.allocateDirect(quad.size * 4)
            .order(ByteOrder.nativeOrder())
            .asFloatBuffer()
            .apply {
                put(quad)
                position(0)
            }
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
        val status = GLES30.glCheckFramebufferStatus(GLES30.GL_FRAMEBUFFER)
        check(status == GLES30.GL_FRAMEBUFFER_COMPLETE) {
            "FBO incomplete: 0x${Integer.toHexString(status)}"
        }
        width = w
        height = h
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
        val fs = try {
            compileShader(GLES30.GL_FRAGMENT_SHADER, fragmentSrc)
        } catch (e: IllegalStateException) {
            GLES30.glDeleteShader(vs)
            throw e
        }
        val program = GLES30.glCreateProgram()
        GLES30.glAttachShader(program, vs)
        GLES30.glAttachShader(program, fs)
        GLES30.glLinkProgram(program)
        // Only flagged for deletion; freed together with the program.
        GLES30.glDeleteShader(vs)
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

    private companion object {
        const val BAND_HEIGHT = 256
    }
}
