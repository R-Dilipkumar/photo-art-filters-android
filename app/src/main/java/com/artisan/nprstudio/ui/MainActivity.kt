package com.artisan.nprstudio.ui

import android.os.Bundle
import androidx.activity.ComponentActivity
import androidx.activity.enableEdgeToEdge
import androidx.activity.compose.rememberLauncherForActivityResult
import androidx.activity.compose.setContent
import androidx.activity.result.PickVisualMediaRequest
import androidx.activity.result.contract.ActivityResultContracts
import androidx.compose.foundation.Image
import androidx.compose.foundation.background
import androidx.compose.foundation.gestures.detectTapGestures
import androidx.compose.foundation.horizontalScroll
import androidx.compose.foundation.layout.*
import androidx.compose.foundation.rememberScrollState
import androidx.compose.foundation.shape.RoundedCornerShape
import androidx.compose.material3.*
import androidx.compose.runtime.*
import androidx.compose.ui.Alignment
import androidx.compose.ui.Modifier
import androidx.compose.ui.graphics.Color
import androidx.compose.ui.graphics.asImageBitmap
import androidx.compose.ui.input.pointer.pointerInput
import androidx.compose.ui.layout.ContentScale
import androidx.compose.ui.text.font.FontWeight
import androidx.compose.ui.unit.dp
import androidx.lifecycle.compose.collectAsStateWithLifecycle
import androidx.lifecycle.viewmodel.compose.viewModel
import com.artisan.nprstudio.model.NprStyle

class MainActivity : ComponentActivity() {
    override fun onCreate(savedInstanceState: Bundle?) {
        super.onCreate(savedInstanceState)
        enableEdgeToEdge()
        setContent {
            MaterialTheme(colorScheme = darkColorScheme()) {
                NprStudioScreen()
            }
        }
    }
}

@Composable
fun NprStudioScreen(viewModel: NprViewModel = viewModel()) {
    val state by viewModel.uiState.collectAsStateWithLifecycle()
    var showOriginal by remember { mutableStateOf(false) }

    val photoPicker = rememberLauncherForActivityResult(
        contract = ActivityResultContracts.PickVisualMedia()
    ) { uri ->
        uri?.let { viewModel.loadPhoto(it) }
    }

    Scaffold(
        topBar = {
            Row(
                modifier = Modifier
                    .fillMaxWidth()
                    .statusBarsPadding()
                    .padding(horizontal = 16.dp, vertical = 12.dp),
                horizontalArrangement = Arrangement.SpaceBetween,
                verticalAlignment = Alignment.CenterVertically
            ) {
                // weight(1f): the buttons keep their size, the title wraps if space is short.
                Column(modifier = Modifier.weight(1f)) {
                    Text("Artisan NPR Studio", style = MaterialTheme.typography.titleMedium, fontWeight = FontWeight.Bold)
                    Text(state.config.style.subtitle, style = MaterialTheme.typography.bodySmall, color = Color.Gray)
                }
                Row(horizontalArrangement = Arrangement.spacedBy(8.dp)) {
                    OutlinedButton(onClick = {
                        photoPicker.launch(PickVisualMediaRequest(ActivityResultContracts.PickVisualMedia.ImageOnly))
                    }) {
                        Text("Load Photo")
                    }
                    Button(onClick = { viewModel.exportHighRes() }) {
                        Text("Export")
                    }
                }
            }
        }
    ) { padding ->
        Column(
            modifier = Modifier
                .fillMaxSize()
                .padding(padding)
                .padding(horizontal = 16.dp),
            verticalArrangement = Arrangement.spacedBy(12.dp)
        ) {
            // 1. Interactive Canvas Preview (Hold to compare with original)
            Box(
                modifier = Modifier
                    .fillMaxWidth()
                    .weight(1f)
                    .background(Color(0xFF18181B), RoundedCornerShape(16.dp))
                    .pointerInput(Unit) {
                        detectTapGestures(
                            onPress = {
                                showOriginal = true
                                tryAwaitRelease()
                                showOriginal = false
                            }
                        )
                    },
                contentAlignment = Alignment.Center
            ) {
                val displayBmp = if (showOriginal) state.sourcePreview else state.renderedPreview
                displayBmp?.let { bmp ->
                    Image(
                        bitmap = bmp.asImageBitmap(),
                        contentDescription = "NPR Canvas",
                        modifier = Modifier.fillMaxSize().padding(8.dp),
                        contentScale = ContentScale.Fit
                    )
                }
                if (state.isProcessing) {
                    CircularProgressIndicator(modifier = Modifier.size(36.dp))
                }
            }

            // 2. Style Selector Carousel
            Row(
                modifier = Modifier
                    .fillMaxWidth()
                    .horizontalScroll(rememberScrollState()),
                horizontalArrangement = Arrangement.spacedBy(8.dp)
            ) {
                NprStyle.entries.forEach { style ->
                    FilterChip(
                        selected = state.config.style == style,
                        onClick = { viewModel.updateStyle(style) },
                        label = { Text(style.title) }
                    )
                }
            }

            // 3. Mathematical Parameter Sliders
            Card(
                shape = RoundedCornerShape(16.dp),
                modifier = Modifier.fillMaxWidth()
            ) {
                Column(modifier = Modifier.padding(14.dp), verticalArrangement = Arrangement.spacedBy(6.dp)) {
                    ParameterSlider(
                        label = state.config.style.primaryParamLabel,
                        value = state.config.param1,
                        onValueChange = { viewModel.updateParams(param1 = it) }
                    )
                    ParameterSlider(
                        label = state.config.style.secondaryParamLabel,
                        value = state.config.param2,
                        onValueChange = { viewModel.updateParams(param2 = it) }
                    )
                    ParameterSlider(
                        label = state.config.style.tertiaryParamLabel,
                        value = state.config.param3,
                        onValueChange = { viewModel.updateParams(param3 = it) }
                    )
                    Row(
                        modifier = Modifier.fillMaxWidth(),
                        horizontalArrangement = Arrangement.SpaceBetween,
                        verticalAlignment = Alignment.CenterVertically
                    ) {
                        Text("CPU Sobel Ink Contour Pass", style = MaterialTheme.typography.bodySmall)
                        Switch(
                            checked = state.config.useCpuRefinement,
                            onCheckedChange = { viewModel.updateParams(useCpuRefinement = it) }
                        )
                    }
                }
            }

            state.statusMessage?.let { msg ->
                Text(msg, style = MaterialTheme.typography.labelMedium, color = MaterialTheme.colorScheme.primary)
            }
        }
    }
}

@Composable
private fun ParameterSlider(label: String, value: Float, onValueChange: (Float) -> Unit) {
    Column {
        Row(
            modifier = Modifier.fillMaxWidth(),
            horizontalArrangement = Arrangement.SpaceBetween
        ) {
            Text(label, style = MaterialTheme.typography.labelMedium)
            Text("${(value * 100).toInt()}%", style = MaterialTheme.typography.labelSmall)
        }
        Slider(value = value, onValueChange = onValueChange, valueRange = 0f..1f)
    }
}
