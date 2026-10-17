package com.artisan.nprstudio.ui

import android.app.Application
import android.graphics.Bitmap
import android.net.Uri
import androidx.lifecycle.AndroidViewModel
import androidx.lifecycle.viewModelScope
import com.artisan.nprstudio.engine.CpuMathEngine
import com.artisan.nprstudio.engine.GlRenderer
import com.artisan.nprstudio.engine.ShaderCatalog
import com.artisan.nprstudio.engine.ShaderDef
import com.artisan.nprstudio.engine.ShaderParam
import com.artisan.nprstudio.model.Finish
import com.artisan.nprstudio.model.PostPasses
import com.artisan.nprstudio.model.RenderSettings
import com.artisan.nprstudio.util.BitmapRepository
import kotlinx.coroutines.CancellationException
import kotlinx.coroutines.Dispatchers
import kotlinx.coroutines.Job
import kotlinx.coroutines.flow.MutableStateFlow
import kotlinx.coroutines.flow.StateFlow
import kotlinx.coroutines.flow.asStateFlow
import kotlinx.coroutines.flow.collectLatest
import kotlinx.coroutines.flow.filterNotNull
import kotlinx.coroutines.flow.update
import kotlinx.coroutines.launch
import kotlinx.coroutines.withContext
import kotlin.random.Random

data class NprUiState(
    val sourcePreview: Bitmap? = null,
    val renderedPreview: Bitmap? = null,
    val categories: List<String> = emptyList(),
    val categoryIndex: Int = 0,
    val shadersInCategory: List<ShaderDef> = emptyList(),
    val shader: ShaderDef? = null,
    val values: Map<String, Float> = emptyMap(),
    val colors: Map<String, Int> = emptyMap(),
    val finish: Finish = Finish(),
    val post: PostPasses = PostPasses(),
    val thumbnails: Map<String, Bitmap> = emptyMap(),
    val shaderCount: Int = 0,
    val isProcessing: Boolean = false,
    val statusMessage: String? = null
)

/** Uses the Application context, so a long export never holds on to an Activity. */
class NprViewModel(app: Application) : AndroidViewModel(app) {

    private val catalog = ShaderCatalog.load(app.assets)
    private val renderer = GlRenderer(catalog.vertexSource)
    private val thumbRenderer = GlRenderer(catalog.vertexSource)

    private val _uiState = MutableStateFlow(NprUiState())
    val uiState: StateFlow<NprUiState> = _uiState.asStateFlow()

    private var currentUri: Uri? = null

    // Each shader remembers its own slider and colour values while the app is open.
    private val savedValues = HashMap<String, Map<String, Float>>()
    private val savedColors = HashMap<String, Map<String, Int>>()

    // sourceId changes with every new photo, so the same settings still re-render.
    private data class RenderRequest(val settings: RenderSettings, val sourceId: Int)

    private val requests = MutableStateFlow<RenderRequest?>(null)
    private var sourceId = 0
    private var thumbJob: Job? = null
    private var thumbSourceReady = false

    init {
        val first = catalog.categories.firstOrNull()
        val shaders = first?.let { catalog.inCategory(it) }.orEmpty()
        val shader = shaders.firstOrNull()
        _uiState.value = NprUiState(
            categories = catalog.categories,
            shadersInCategory = shaders,
            shader = shader,
            values = shader?.defaultValues().orEmpty(),
            colors = shader?.defaultColors().orEmpty(),
            shaderCount = catalog.shaders.size,
            statusMessage = catalog.problems.takeIf { it.isNotEmpty() }
                ?.let { "Skipped ${it.size} shader file(s): ${it.first()}" }
        )
        viewModelScope.launch {
            // A new request cancels the wait for the old one, and withContext() drops the
            // result of a cancelled call, so a stale image is never shown.
            requests.filterNotNull().collectLatest { renderPreview(it.settings) }
        }
        viewModelScope.launch {
            try {
                setSource(BitmapRepository.generateSampleLandscape())
            } catch (e: CancellationException) {
                throw e
            } catch (e: Exception) {
                _uiState.update { it.copy(statusMessage = "GPU setup failed: ${e.message}") }
            }
        }
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

    // ------------------------------------------------------------- choosing a style

    fun selectCategory(index: Int) {
        val category = catalog.categories.getOrNull(index) ?: return
        val shaders = catalog.inCategory(category)
        _uiState.update { it.copy(categoryIndex = index, shadersInCategory = shaders) }
        shaders.firstOrNull()?.let { selectShader(it.id) }
        refreshThumbnails()
    }

    fun selectShader(id: String) {
        val def = catalog.byId(id) ?: return
        rememberCurrent()
        _uiState.update {
            it.copy(
                shader = def,
                values = savedValues[id] ?: def.defaultValues(),
                colors = savedColors[id] ?: def.defaultColors()
            )
        }
        requestRender()
    }

    // ------------------------------------------------------------- controls

    fun setValue(uniform: String, value: Float) {
        _uiState.update { it.copy(values = it.values + (uniform to value)) }
        requestRender()
    }

    fun setColor(uniform: String, rgb: Int) {
        _uiState.update { it.copy(colors = it.colors + (uniform to rgb)) }
        requestRender()
    }

    fun setFinish(finish: Finish) {
        _uiState.update { it.copy(finish = finish) }
        requestRender()
    }

    fun setPost(post: PostPasses) {
        _uiState.update { it.copy(post = post) }
        requestRender()
    }

    /** Back to the shader's default controls and a neutral finish. */
    fun reset() {
        val def = _uiState.value.shader ?: return
        _uiState.update {
            it.copy(
                values = def.defaultValues(),
                colors = def.defaultColors(),
                finish = Finish(),
                post = PostPasses()
            )
        }
        requestRender()
    }

    /** Random slider/toggle/choice values, staying away from the extreme ends. */
    fun surprise() {
        val def = _uiState.value.shader ?: return
        val random = def.params.mapNotNull { p ->
            when (p) {
                is ShaderParam.Slider -> p.uniform to (p.min + (p.max - p.min) * Random.nextDouble(0.1, 0.9).toFloat())
                is ShaderParam.Toggle -> p.uniform to if (Random.nextBoolean()) 1f else 0f
                is ShaderParam.Choice -> p.uniform to Random.nextInt(p.options.size).toFloat()
                is ShaderParam.ColorPick -> null
            }
        }.toMap()
        _uiState.update { it.copy(values = random) }
        requestRender()
    }

    private fun rememberCurrent() {
        val s = _uiState.value
        val def = s.shader ?: return
        savedValues[def.id] = s.values
        savedColors[def.id] = s.colors
    }

    private fun currentSettings(): RenderSettings? {
        val s = _uiState.value
        val def = s.shader ?: return null
        return RenderSettings(def.id, s.values, s.colors, s.finish, s.post)
    }

    private fun requestRender() {
        currentSettings()?.let { requests.value = RenderRequest(it, sourceId) }
    }

    // ------------------------------------------------------------- rendering

    private suspend fun setSource(bmp: Bitmap) {
        renderer.setSource(bmp)
        sourceId++
        _uiState.update { it.copy(sourcePreview = bmp, thumbnails = emptyMap()) }
        requestRender()
        thumbSourceReady = false
        thumbRenderer.setSource(thumbnailSource(bmp))
        thumbSourceReady = true
        refreshThumbnails()
    }

    private suspend fun renderPreview(settings: RenderSettings) {
        val def = catalog.byId(settings.shaderId) ?: return
        _uiState.update { it.copy(isProcessing = true) }
        try {
            var result = renderer.render(
                def, catalog.fragmentSource(def), settings.values, settings.colors, settings.finish
            )
            result = applyPost(result, settings.post)
            _uiState.update { it.copy(renderedPreview = result, isProcessing = false) }
        } catch (e: CancellationException) {
            throw e
        } catch (e: Exception) {
            _uiState.update {
                it.copy(isProcessing = false, statusMessage = "${def.name} failed: ${e.message}")
            }
        }
    }

    private suspend fun applyPost(image: Bitmap, post: PostPasses): Bitmap {
        if (!post.inkOutlines && !post.dither) return image
        return withContext(Dispatchers.Default) {
            var out = image
            if (post.inkOutlines) out = CpuMathEngine.applySobelInkOverlay(out, edgeStrength = 0.65f)
            if (post.dither) out = CpuMathEngine.applyFloydSteinbergDither(out, post.ditherLevels)
            out
        }
    }

    /** Thumbnails show a centre crop at near preview scale, so textures stay readable. */
    private fun thumbnailSource(source: Bitmap): Bitmap {
        val crop = (minOf(source.width, source.height) * THUMB_CROP).toInt()
        val x = (source.width - crop) / 2
        val y = (source.height - crop) / 2
        val cut = Bitmap.createBitmap(source, x, y, crop, crop)
        return Bitmap.createScaledBitmap(cut, THUMB_SIZE, THUMB_SIZE, true)
    }

    private fun thumbnailScale(): Float {
        val source = _uiState.value.sourcePreview ?: return 0.35f
        val previewPxPerSourcePx = GlRenderer.PREVIEW_SIZE / maxOf(source.width, source.height)
        val cropInPreviewPx = minOf(source.width, source.height) * THUMB_CROP * previewPxPerSourcePx
        return THUMB_SIZE / cropInPreviewPx
    }

    private fun refreshThumbnails() {
        if (!thumbSourceReady) return
        val shaders = _uiState.value.shadersInCategory
        thumbJob?.cancel()
        thumbJob = viewModelScope.launch {
            val scale = thumbnailScale()
            for (def in shaders) {
                if (def.id in _uiState.value.thumbnails) continue
                try {
                    val thumb = thumbRenderer.render(
                        def, catalog.fragmentSource(def), def.defaultValues(), def.defaultColors(),
                        Finish(), scale
                    )
                    _uiState.update { it.copy(thumbnails = it.thumbnails + (def.id to thumb)) }
                } catch (e: CancellationException) {
                    throw e
                } catch (e: Exception) {
                    // A broken shader just shows no thumbnail; selecting it reports the error.
                }
            }
        }
    }

    // ------------------------------------------------------------- export

    fun exportHighRes() {
        val settings = currentSettings() ?: return
        val def = catalog.byId(settings.shaderId) ?: return
        val uri = currentUri
        viewModelScope.launch {
            _uiState.update { it.copy(isProcessing = true, statusMessage = "Rendering high-res art...") }
            val saved = try {
                // Own context and thread, so the preview keeps working; closed when done.
                GlRenderer(catalog.vertexSource).use { exporter ->
                    val fullResSource = withContext(Dispatchers.IO) {
                        uri?.let {
                            BitmapRepository.loadAndScaleBitmap(getApplication(), it, maxDimension = 3200)
                        }
                    } ?: _uiState.value.sourcePreview ?: error("No image loaded")
                    // Throws (-> "Export failed") if the image is over GL_MAX_TEXTURE_SIZE.
                    exporter.setSource(fullResSource)
                    val styled = exporter.render(
                        def, catalog.fragmentSource(def), settings.values, settings.colors, settings.finish
                    )
                    val output = applyPost(styled, settings.post)
                    withContext(Dispatchers.IO) {
                        BitmapRepository.saveBitmapToGallery(getApplication(), output, def.id)
                    }
                }
            } catch (e: CancellationException) {
                throw e
            } catch (e: Exception) {
                false
            }
            _uiState.update {
                it.copy(
                    isProcessing = false,
                    statusMessage = if (saved) "Saved to Pictures/ArtisanNPR" else "Export failed"
                )
            }
        }
    }

    override fun onCleared() {
        renderer.close()
        thumbRenderer.close()
    }

    private companion object {
        const val THUMB_SIZE = 192
        const val THUMB_CROP = 0.55f
    }
}
