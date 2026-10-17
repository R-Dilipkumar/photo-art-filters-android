package com.artisan.nprstudio.ui

import android.app.Application
import android.graphics.Bitmap
import android.net.Uri
import androidx.lifecycle.AndroidViewModel
import androidx.lifecycle.viewModelScope
import com.artisan.nprstudio.engine.CpuMathEngine
import com.artisan.nprstudio.engine.GlRenderer
import com.artisan.nprstudio.model.NprFilterConfig
import com.artisan.nprstudio.model.NprStyle
import com.artisan.nprstudio.util.BitmapRepository
import kotlinx.coroutines.CancellationException
import kotlinx.coroutines.Dispatchers
import kotlinx.coroutines.flow.MutableStateFlow
import kotlinx.coroutines.flow.StateFlow
import kotlinx.coroutines.flow.asStateFlow
import kotlinx.coroutines.flow.collectLatest
import kotlinx.coroutines.flow.filterNotNull
import kotlinx.coroutines.flow.update
import kotlinx.coroutines.flow.updateAndGet
import kotlinx.coroutines.launch
import kotlinx.coroutines.withContext

data class NprUiState(
    val sourcePreview: Bitmap? = null,
    val renderedPreview: Bitmap? = null,
    val config: NprFilterConfig = NprFilterConfig(),
    val isProcessing: Boolean = false,
    val statusMessage: String? = null
)

/** Uses the Application context, so a long export never holds on to an Activity. */
class NprViewModel(app: Application) : AndroidViewModel(app) {

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
            // A new request cancels the wait for the old one, and withContext() drops the
            // result of a cancelled call, so a stale image is never shown.
            requests.filterNotNull().collectLatest { renderPreview(it.config) }
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

    fun updateStyle(style: NprStyle) = updateConfig { it.copy(style = style) }

    fun updateParams(
        param1: Float = _uiState.value.config.param1,
        param2: Float = _uiState.value.config.param2,
        param3: Float = _uiState.value.config.param3,
        useCpuRefinement: Boolean = _uiState.value.config.useCpuRefinement
    ) = updateConfig {
        it.copy(
            param1 = param1,
            param2 = param2,
            param3 = param3,
            useCpuRefinement = useCpuRefinement
        )
    }

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
            var result = renderer.render(config)
            if (config.useCpuRefinement) {
                val painted = result
                result = withContext(Dispatchers.Default) {
                    CpuMathEngine.applySobelInkOverlay(painted, edgeStrength = 0.65f)
                }
            }
            _uiState.update { it.copy(renderedPreview = result, isProcessing = false) }
        } catch (e: CancellationException) {
            throw e
        } catch (e: Exception) {
            _uiState.update {
                it.copy(isProcessing = false, statusMessage = "Render failed: ${e.message}")
            }
        }
    }

    fun exportHighRes() {
        val activeConfig = _uiState.value.config
        val uri = currentUri
        viewModelScope.launch {
            _uiState.update {
                it.copy(isProcessing = true, statusMessage = "Rendering High-Res Art...")
            }
            val saved = try {
                // Own context and thread, so the preview keeps working; closed when done.
                GlRenderer().use { exporter ->
                    val fullResSource = withContext(Dispatchers.IO) {
                        uri?.let {
                            BitmapRepository.loadAndScaleBitmap(getApplication(), it, maxDimension = 3200)
                        }
                    } ?: _uiState.value.sourcePreview ?: error("No image loaded")
                    // Throws (-> "Export Failed") if the image is over GL_MAX_TEXTURE_SIZE.
                    exporter.setSource(fullResSource)
                    var highResOutput = exporter.render(activeConfig)
                    if (activeConfig.useCpuRefinement) {
                        val painted = highResOutput
                        highResOutput = withContext(Dispatchers.Default) {
                            CpuMathEngine.applySobelInkOverlay(painted, edgeStrength = 0.65f)
                        }
                    }
                    val output = highResOutput
                    withContext(Dispatchers.IO) {
                        BitmapRepository.saveBitmapToGallery(
                            getApplication(), output, activeConfig.style.name
                        )
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
                    statusMessage = if (saved) "Saved to Pictures/ArtisanNPR" else "Export Failed"
                )
            }
        }
    }

    override fun onCleared() = renderer.close()
}
