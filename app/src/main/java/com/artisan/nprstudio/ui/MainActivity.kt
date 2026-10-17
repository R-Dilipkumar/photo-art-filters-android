package com.artisan.nprstudio.ui

import android.os.Bundle
import androidx.activity.ComponentActivity
import androidx.activity.compose.rememberLauncherForActivityResult
import androidx.activity.compose.setContent
import androidx.activity.enableEdgeToEdge
import androidx.activity.result.PickVisualMediaRequest
import androidx.activity.result.contract.ActivityResultContracts
import androidx.compose.foundation.Image
import androidx.compose.foundation.background
import androidx.compose.foundation.gestures.detectTapGestures
import androidx.compose.foundation.layout.Arrangement
import androidx.compose.foundation.layout.Box
import androidx.compose.foundation.layout.Column
import androidx.compose.foundation.layout.Row
import androidx.compose.foundation.layout.fillMaxSize
import androidx.compose.foundation.layout.fillMaxWidth
import androidx.compose.foundation.layout.padding
import androidx.compose.foundation.layout.size
import androidx.compose.foundation.layout.statusBarsPadding
import androidx.compose.foundation.shape.RoundedCornerShape
import androidx.compose.material3.Button
import androidx.compose.material3.CircularProgressIndicator
import androidx.compose.material3.MaterialTheme
import androidx.compose.material3.OutlinedButton
import androidx.compose.material3.Scaffold
import androidx.compose.material3.Text
import androidx.compose.material3.darkColorScheme
import androidx.compose.runtime.Composable
import androidx.compose.runtime.getValue
import androidx.compose.runtime.mutableStateOf
import androidx.compose.runtime.remember
import androidx.compose.runtime.setValue
import androidx.compose.ui.Alignment
import androidx.compose.ui.Modifier
import androidx.compose.ui.graphics.Color
import androidx.compose.ui.graphics.asImageBitmap
import androidx.compose.ui.input.pointer.pointerInput
import androidx.compose.ui.layout.ContentScale
import androidx.compose.ui.text.font.FontWeight
import androidx.compose.ui.text.style.TextOverflow
import androidx.compose.ui.unit.dp
import androidx.lifecycle.compose.collectAsStateWithLifecycle
import androidx.lifecycle.viewmodel.compose.viewModel

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
                    .padding(horizontal = 16.dp, vertical = 10.dp),
                horizontalArrangement = Arrangement.spacedBy(8.dp),
                verticalAlignment = Alignment.CenterVertically
            ) {
                // weight(1f): the buttons keep their size, the title wraps if space is short.
                Column(modifier = Modifier.weight(1f)) {
                    Text(
                        state.shader?.name ?: "Artisan NPR Studio",
                        style = MaterialTheme.typography.titleMedium,
                        fontWeight = FontWeight.Bold,
                        maxLines = 1,
                        overflow = TextOverflow.Ellipsis
                    )
                    Text(
                        "${state.categories.getOrNull(state.categoryIndex).orEmpty()} · ${state.shaderCount} styles",
                        style = MaterialTheme.typography.bodySmall,
                        color = Color.Gray
                    )
                }
                OutlinedButton(onClick = {
                    photoPicker.launch(PickVisualMediaRequest(ActivityResultContracts.PickVisualMedia.ImageOnly))
                }) {
                    Text("Load")
                }
                Button(onClick = { viewModel.exportHighRes() }) {
                    Text("Export")
                }
            }
        }
    ) { padding ->
        Column(
            modifier = Modifier
                .fillMaxSize()
                .padding(padding),
            verticalArrangement = Arrangement.spacedBy(8.dp)
        ) {
            // Preview. Press and hold to see the original photo.
            Box(
                modifier = Modifier
                    .fillMaxWidth()
                    .weight(1f)
                    .padding(horizontal = 12.dp)
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
                    val image = remember(bmp) { bmp.asImageBitmap() }
                    Image(
                        bitmap = image,
                        contentDescription = "Styled image",
                        modifier = Modifier
                            .fillMaxSize()
                            .padding(6.dp),
                        contentScale = ContentScale.Fit
                    )
                }
                if (state.isProcessing) {
                    CircularProgressIndicator(modifier = Modifier.size(32.dp))
                }
            }

            state.statusMessage?.let { msg ->
                Text(
                    msg,
                    style = MaterialTheme.typography.labelMedium,
                    color = MaterialTheme.colorScheme.primary,
                    maxLines = 2,
                    modifier = Modifier.padding(horizontal = 16.dp)
                )
            }

            ControlsPanel(
                shader = state.shader,
                values = state.values,
                colors = state.colors,
                finish = state.finish,
                post = state.post,
                onValue = viewModel::setValue,
                onColor = viewModel::setColor,
                onFinish = viewModel::setFinish,
                onPost = viewModel::setPost,
                onReset = viewModel::reset,
                onSurprise = viewModel::surprise,
                modifier = Modifier.padding(horizontal = 12.dp)
            )

            ShaderStrip(
                shaders = state.shadersInCategory,
                selectedId = state.shader?.id,
                thumbnails = state.thumbnails,
                onSelect = viewModel::selectShader
            )

            CategoryDial(
                categories = state.categories,
                selected = state.categoryIndex,
                onSelected = viewModel::selectCategory
            )
        }
    }
}
