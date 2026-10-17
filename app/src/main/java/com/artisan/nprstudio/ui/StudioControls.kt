package com.artisan.nprstudio.ui

import android.graphics.Bitmap
import androidx.compose.foundation.Image
import androidx.compose.foundation.background
import androidx.compose.foundation.border
import androidx.compose.foundation.clickable
import androidx.compose.foundation.horizontalScroll
import androidx.compose.foundation.layout.Arrangement
import androidx.compose.foundation.layout.Box
import androidx.compose.foundation.layout.Column
import androidx.compose.foundation.layout.PaddingValues
import androidx.compose.foundation.layout.Row
import androidx.compose.foundation.layout.Spacer
import androidx.compose.foundation.layout.fillMaxWidth
import androidx.compose.foundation.layout.heightIn
import androidx.compose.foundation.layout.padding
import androidx.compose.foundation.layout.size
import androidx.compose.foundation.layout.width
import androidx.compose.foundation.lazy.LazyRow
import androidx.compose.foundation.lazy.items
import androidx.compose.foundation.lazy.rememberLazyListState
import androidx.compose.foundation.rememberScrollState
import androidx.compose.foundation.shape.CircleShape
import androidx.compose.foundation.shape.RoundedCornerShape
import androidx.compose.foundation.verticalScroll
import androidx.compose.material3.Card
import androidx.compose.material3.FilterChip
import androidx.compose.material3.MaterialTheme
import androidx.compose.material3.Slider
import androidx.compose.material3.Switch
import androidx.compose.material3.Text
import androidx.compose.material3.TextButton
import androidx.compose.runtime.Composable
import androidx.compose.runtime.LaunchedEffect
import androidx.compose.runtime.getValue
import androidx.compose.runtime.mutableIntStateOf
import androidx.compose.runtime.remember
import androidx.compose.runtime.saveable.rememberSaveable
import androidx.compose.runtime.setValue
import androidx.compose.ui.Alignment
import androidx.compose.ui.Modifier
import androidx.compose.ui.draw.clip
import androidx.compose.ui.graphics.Color
import androidx.compose.ui.graphics.asImageBitmap
import androidx.compose.ui.layout.ContentScale
import androidx.compose.ui.text.style.TextAlign
import androidx.compose.ui.text.style.TextOverflow
import androidx.compose.ui.unit.dp
import com.artisan.nprstudio.engine.ShaderDef
import com.artisan.nprstudio.engine.ShaderParam
import com.artisan.nprstudio.model.Finish
import com.artisan.nprstudio.model.PostPasses
import java.util.Locale

/** Live thumbnails of the shaders in the current category. */
@Composable
fun ShaderStrip(
    shaders: List<ShaderDef>,
    selectedId: String?,
    thumbnails: Map<String, Bitmap>,
    onSelect: (String) -> Unit,
    modifier: Modifier = Modifier
) {
    val listState = rememberLazyListState()
    LaunchedEffect(shaders) { listState.scrollToItem(0) }
    LazyRow(
        state = listState,
        modifier = modifier.fillMaxWidth(),
        contentPadding = PaddingValues(horizontal = 12.dp),
        horizontalArrangement = Arrangement.spacedBy(8.dp)
    ) {
        items(shaders, key = { it.id }) { def ->
            val selected = def.id == selectedId
            Column(
                modifier = Modifier
                    .width(76.dp)
                    .clip(RoundedCornerShape(12.dp))
                    .clickable { onSelect(def.id) },
                horizontalAlignment = Alignment.CenterHorizontally
            ) {
                Box(
                    modifier = Modifier
                        .size(68.dp)
                        .clip(RoundedCornerShape(12.dp))
                        .background(MaterialTheme.colorScheme.surfaceVariant)
                        .border(
                            width = if (selected) 3.dp else 0.dp,
                            color = if (selected) MaterialTheme.colorScheme.primary else Color.Transparent,
                            shape = RoundedCornerShape(12.dp)
                        )
                ) {
                    val thumb = thumbnails[def.id]
                    if (thumb != null) {
                        val image = remember(thumb) { thumb.asImageBitmap() }
                        Image(
                            bitmap = image,
                            contentDescription = def.name,
                            contentScale = ContentScale.Crop,
                            modifier = Modifier.size(68.dp)
                        )
                    }
                }
                Text(
                    def.name,
                    style = MaterialTheme.typography.labelSmall,
                    color = if (selected) MaterialTheme.colorScheme.primary else MaterialTheme.colorScheme.onSurface,
                    textAlign = TextAlign.Center,
                    maxLines = 2,
                    overflow = TextOverflow.Ellipsis,
                    modifier = Modifier.padding(top = 2.dp)
                )
            }
        }
    }
}

/** "Controls" tab = the shader's own sliders; "Finish" tab = shared adjustments. */
@Composable
fun ControlsPanel(
    shader: ShaderDef?,
    values: Map<String, Float>,
    colors: Map<String, Int>,
    finish: Finish,
    post: PostPasses,
    onValue: (String, Float) -> Unit,
    onColor: (String, Int) -> Unit,
    onFinish: (Finish) -> Unit,
    onPost: (PostPasses) -> Unit,
    onReset: () -> Unit,
    onSurprise: () -> Unit,
    modifier: Modifier = Modifier
) {
    var tab by rememberSaveable { mutableIntStateOf(0) }
    Card(shape = RoundedCornerShape(16.dp), modifier = modifier.fillMaxWidth()) {
        Column(Modifier.padding(horizontal = 12.dp, vertical = 8.dp)) {
            Row(verticalAlignment = Alignment.CenterVertically) {
                FilterChip(selected = tab == 0, onClick = { tab = 0 }, label = { Text("Controls") })
                Spacer(Modifier.width(6.dp))
                FilterChip(selected = tab == 1, onClick = { tab = 1 }, label = { Text("Finish") })
                Spacer(Modifier.weight(1f))
                TextButton(onClick = onSurprise) { Text("Surprise") }
                TextButton(onClick = onReset) { Text("Reset") }
            }
            Column(
                modifier = Modifier
                    .heightIn(max = 190.dp)
                    .verticalScroll(rememberScrollState()),
                verticalArrangement = Arrangement.spacedBy(2.dp)
            ) {
                if (tab == 0 && shader != null) {
                    if (shader.description.isNotBlank()) {
                        Text(
                            shader.description,
                            style = MaterialTheme.typography.bodySmall,
                            color = MaterialTheme.colorScheme.onSurfaceVariant
                        )
                    }
                    for (p in shader.params) {
                        ParamControl(p, values, colors, onValue, onColor)
                    }
                } else if (tab == 1) {
                    LabeledSlider("Strength", finish.strength, 0f..1f) { onFinish(finish.copy(strength = it)) }
                    LabeledSlider("Brightness", finish.brightness, -0.3f..0.3f) { onFinish(finish.copy(brightness = it)) }
                    LabeledSlider("Contrast", finish.contrast, 0.5f..1.6f) { onFinish(finish.copy(contrast = it)) }
                    LabeledSlider("Saturation", finish.saturation, 0f..2f) { onFinish(finish.copy(saturation = it)) }
                    LabeledSwitch("Ink outlines (CPU)", post.inkOutlines) { onPost(post.copy(inkOutlines = it)) }
                    LabeledSwitch("Floyd–Steinberg dither (CPU)", post.dither) { onPost(post.copy(dither = it)) }
                    if (post.dither) {
                        LabeledSlider("Dither levels", post.ditherLevels.toFloat(), 2f..8f, steps = 5) {
                            onPost(post.copy(ditherLevels = it.toInt()))
                        }
                    }
                }
            }
        }
    }
}

@Composable
private fun ParamControl(
    p: ShaderParam,
    values: Map<String, Float>,
    colors: Map<String, Int>,
    onValue: (String, Float) -> Unit,
    onColor: (String, Int) -> Unit
) {
    when (p) {
        is ShaderParam.Slider -> LabeledSlider(p.label, values[p.uniform] ?: p.default, p.min..p.max) {
            onValue(p.uniform, it)
        }
        is ShaderParam.Toggle -> LabeledSwitch(p.label, (values[p.uniform] ?: 0f) > 0.5f) {
            onValue(p.uniform, if (it) 1f else 0f)
        }
        is ShaderParam.Choice -> {
            val current = (values[p.uniform] ?: p.default.toFloat()).toInt()
            Text(p.label, style = MaterialTheme.typography.labelMedium)
            Row(
                Modifier.horizontalScroll(rememberScrollState()),
                horizontalArrangement = Arrangement.spacedBy(6.dp)
            ) {
                p.options.forEachIndexed { i, option ->
                    FilterChip(
                        selected = i == current,
                        onClick = { onValue(p.uniform, i.toFloat()) },
                        label = { Text(option) }
                    )
                }
            }
        }
        is ShaderParam.ColorPick -> {
            val current = colors[p.uniform] ?: p.default
            Text(p.label, style = MaterialTheme.typography.labelMedium)
            Row(
                Modifier
                    .horizontalScroll(rememberScrollState())
                    .padding(vertical = 4.dp),
                horizontalArrangement = Arrangement.spacedBy(8.dp)
            ) {
                (listOf(p.default) + SWATCHES.filter { it != p.default }).forEach { rgb ->
                    val selected = rgb == current
                    Box(
                        Modifier
                            .size(30.dp)
                            .clip(CircleShape)
                            .background(Color(0xFF000000.toInt() or rgb))
                            .border(
                                width = if (selected) 3.dp else 1.dp,
                                color = if (selected) MaterialTheme.colorScheme.primary else MaterialTheme.colorScheme.outline,
                                shape = CircleShape
                            )
                            .clickable { onColor(p.uniform, rgb) }
                    )
                }
            }
        }
    }
}

@Composable
private fun LabeledSlider(
    label: String,
    value: Float,
    range: ClosedFloatingPointRange<Float>,
    steps: Int = 0,
    onChange: (Float) -> Unit
) {
    Column {
        Row(Modifier.fillMaxWidth(), horizontalArrangement = Arrangement.SpaceBetween) {
            Text(label, style = MaterialTheme.typography.labelMedium)
            Text(formatValue(value, range), style = MaterialTheme.typography.labelSmall)
        }
        Slider(value = value, onValueChange = onChange, valueRange = range, steps = steps)
    }
}

@Composable
private fun LabeledSwitch(label: String, checked: Boolean, onChange: (Boolean) -> Unit) {
    Row(
        Modifier.fillMaxWidth(),
        horizontalArrangement = Arrangement.SpaceBetween,
        verticalAlignment = Alignment.CenterVertically
    ) {
        Text(label, style = MaterialTheme.typography.labelMedium)
        Switch(checked = checked, onCheckedChange = onChange)
    }
}

private fun formatValue(value: Float, range: ClosedFloatingPointRange<Float>): String {
    val span = range.endInclusive - range.start
    return when {
        span >= 20f -> value.toInt().toString()
        span >= 2f -> String.format(Locale.US, "%.1f", value)
        else -> String.format(Locale.US, "%.2f", value)
    }
}

/** Colour choices offered for every @color control (plus the shader's own default). */
private val SWATCHES = listOf(
    0x111111, 0xF5F1E6, 0xFFFFFF, 0x8B3A1E, 0xD7263D, 0xF46036, 0xF6C445, 0x2E933C,
    0x1B998B, 0x1D4E89, 0x1F3A93, 0x6A4C93, 0xE84A9C, 0x7D5A50, 0x5C5C5C, 0x00E5FF
)
