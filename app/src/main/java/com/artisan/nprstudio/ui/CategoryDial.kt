package com.artisan.nprstudio.ui

import androidx.compose.animation.core.Animatable
import androidx.compose.animation.core.Spring
import androidx.compose.animation.core.spring
import androidx.compose.foundation.Canvas
import androidx.compose.foundation.gestures.detectHorizontalDragGestures
import androidx.compose.foundation.gestures.detectTapGestures
import androidx.compose.foundation.layout.fillMaxWidth
import androidx.compose.foundation.layout.height
import androidx.compose.material3.MaterialTheme
import androidx.compose.runtime.Composable
import androidx.compose.runtime.LaunchedEffect
import androidx.compose.runtime.getValue
import androidx.compose.runtime.mutableStateOf
import androidx.compose.runtime.remember
import androidx.compose.runtime.rememberCoroutineScope
import androidx.compose.runtime.rememberUpdatedState
import androidx.compose.runtime.setValue
import androidx.compose.ui.Modifier
import androidx.compose.ui.draw.clipToBounds
import androidx.compose.ui.geometry.Offset
import androidx.compose.ui.graphics.Path
import androidx.compose.ui.graphics.drawscope.rotate
import androidx.compose.ui.hapticfeedback.HapticFeedbackType
import androidx.compose.ui.input.pointer.pointerInput
import androidx.compose.ui.platform.LocalHapticFeedback
import androidx.compose.ui.text.TextStyle
import androidx.compose.ui.text.drawText
import androidx.compose.ui.text.font.FontWeight
import androidx.compose.ui.text.rememberTextMeasurer
import androidx.compose.ui.unit.dp
import androidx.compose.ui.unit.sp
import kotlinx.coroutines.launch
import kotlin.math.PI
import kotlin.math.abs
import kotlin.math.atan2
import kotlin.math.cos
import kotlin.math.roundToInt
import kotlin.math.sin

/**
 * A rotary dial, like a camera mode dial: the top of a big wheel with the category
 * names around its rim. Drag sideways to turn it (it ticks and snaps), or tap a name.
 */
@Composable
fun CategoryDial(
    categories: List<String>,
    selected: Int,
    onSelected: (Int) -> Unit,
    modifier: Modifier = Modifier
) {
    if (categories.isEmpty()) return
    val haptics = LocalHapticFeedback.current
    val scope = rememberCoroutineScope()
    val measurer = rememberTextMeasurer()
    val onSelectedNow by rememberUpdatedState(onSelected)

    // Continuous position: 2.0 means category 2 sits at the top of the dial.
    val position = remember { Animatable(selected.toFloat()) }
    var dragging by remember { mutableStateOf(false) }
    LaunchedEffect(selected) {
        if (!dragging && position.value.roundToInt() != selected) {
            position.animateTo(selected.toFloat(), spring(stiffness = Spring.StiffnessMediumLow))
        }
    }

    val rim = MaterialTheme.colorScheme.surfaceVariant
    val tick = MaterialTheme.colorScheme.outline
    val accent = MaterialTheme.colorScheme.primary
    val text = MaterialTheme.colorScheme.onSurface
    val normalStyle = TextStyle(fontSize = 13.sp, color = text)
    val selectedStyle = TextStyle(fontSize = 15.sp, color = accent, fontWeight = FontWeight.Bold)
    val labels = remember(categories, normalStyle, selectedStyle) {
        categories.map { measurer.measure(it, normalStyle) to measurer.measure(it, selectedStyle) }
    }

    fun settle() {
        scope.launch {
            val target = position.value.roundToInt().coerceIn(0, categories.lastIndex)
            onSelectedNow(target)
            position.animateTo(target.toFloat(), spring(stiffness = Spring.StiffnessMediumLow))
        }
    }

    Canvas(
        modifier
            .fillMaxWidth()
            .height(96.dp)
            .clipToBounds()
            .pointerInput(categories.size) {
                val radius = size.width * 0.95f
                val stepRad = STEP_DEG * PI.toFloat() / 180f
                detectHorizontalDragGestures(
                    onDragStart = { dragging = true },
                    onDragEnd = { dragging = false; settle() },
                    onDragCancel = { dragging = false; settle() },
                    onHorizontalDrag = { change, dx ->
                        change.consume()
                        val old = position.value
                        val new = (old - dx / (radius * stepRad))
                            .coerceIn(-0.45f, categories.lastIndex + 0.45f)
                        if (new.roundToInt() != old.roundToInt()) {
                            haptics.performHapticFeedback(HapticFeedbackType.TextHandleMove)
                        }
                        scope.launch { position.snapTo(new) }
                    }
                )
            }
            .pointerInput(categories.size) {
                detectTapGestures { tap ->
                    val radius = size.width * 0.95f
                    val cx = size.width / 2f
                    val cy = TOP_PAD.toPx() + radius
                    val angle = atan2(tap.x - cx, cy - tap.y) * 180f / PI.toFloat()
                    val target = (position.value + angle / STEP_DEG).roundToInt()
                        .coerceIn(0, categories.lastIndex)
                    haptics.performHapticFeedback(HapticFeedbackType.TextHandleMove)
                    onSelectedNow(target)
                    scope.launch {
                        position.animateTo(target.toFloat(), spring(stiffness = Spring.StiffnessMediumLow))
                    }
                }
            }
    ) {
        val radius = size.width * 0.95f
        val center = Offset(size.width / 2f, TOP_PAD.toPx() + radius)
        val pos = position.value
        val nearest = pos.roundToInt()

        // The wheel's rim band.
        drawCircle(rim, radius = radius + 6.dp.toPx(), center = center)
        drawCircle(rim.copy(alpha = 0.55f), radius = radius - 26.dp.toPx(), center = center)

        fun pointAt(angleDeg: Float, r: Float): Offset {
            val a = angleDeg * PI.toFloat() / 180f
            return Offset(center.x + r * sin(a), center.y - r * cos(a))
        }

        // Minor ticks every quarter step, major tick per category.
        var k = -40
        while (k <= categories.size * 4 + 40) {
            val angle = (k / 4f - pos) * STEP_DEG
            if (abs(angle) < 80f) {
                val major = k % 4 == 0 && k / 4 in categories.indices
                val inner = radius - (if (major) 20.dp else 12.dp).toPx()
                drawLine(
                    color = if (major) tick else tick.copy(alpha = 0.4f),
                    start = pointAt(angle, radius - 4.dp.toPx()),
                    end = pointAt(angle, inner),
                    strokeWidth = (if (major) 2.dp else 1.dp).toPx()
                )
            }
            k++
        }

        // Category names around the rim, turned to follow it.
        for (i in categories.indices) {
            val angle = (i - pos) * STEP_DEG
            if (abs(angle) > 75f) continue
            val layout = if (i == nearest) labels[i].second else labels[i].first
            val at = pointAt(angle, radius - 40.dp.toPx())
            val fade = (1f - abs(angle) / 80f).coerceIn(0.15f, 1f)
            rotate(angle, pivot = at) {
                drawText(
                    layout,
                    topLeft = Offset(at.x - layout.size.width / 2f, at.y - layout.size.height / 2f),
                    alpha = fade
                )
            }
        }

        // Pointer at the top centre.
        val tip = TOP_PAD.toPx() + 2.dp.toPx()
        val w = 8.dp.toPx()
        drawPath(
            Path().apply {
                moveTo(center.x - w, 0f)
                lineTo(center.x + w, 0f)
                lineTo(center.x, tip + 6.dp.toPx())
                close()
            },
            color = accent
        )
    }
}

private const val STEP_DEG = 13f
private val TOP_PAD = 6.dp
