package com.artisan.nprstudio.engine

import android.content.res.AssetManager
import java.util.concurrent.ConcurrentHashMap

/**
 * Every shader in assets/shaders/ (*.frag). Adding a shader = adding a file there;
 * nothing else to register. Files with a bad header are skipped and listed in [problems].
 */
class ShaderCatalog(
    val shaders: List<ShaderDef>,
    val problems: List<String>,
    val vertexSource: String,
    private val prelude: String,
    private val footer: String
) {
    private val byId = shaders.associateBy { it.id }

    /** Known categories first in dial order, then any new ones alphabetically. */
    val categories: List<String> = run {
        val present = shaders.map { it.category }.toSet()
        CATEGORY_ORDER.filter { it in present } + (present - CATEGORY_ORDER.toSet()).sorted()
    }

    fun byId(id: String): ShaderDef? = byId[id]

    fun inCategory(category: String): List<ShaderDef> =
        shaders.filter { it.category == category }.sortedBy { it.name }

    private val sources = ConcurrentHashMap<String, String>()

    fun fragmentSource(def: ShaderDef): String =
        sources.getOrPut(def.id) { ShaderSpec.buildFragment(prelude, def, footer) }

    companion object {
        val CATEGORY_ORDER = listOf(
            "Sketch", "Ink", "Paint", "Watercolor", "Print", "Comic & Pop",
            "Mosaic", "Retro", "Film", "Glitch & Neon", "Distort", "Stylize"
        )

        fun load(assets: AssetManager): ShaderCatalog {
            fun read(path: String) = assets.open(path).bufferedReader().use { it.readText() }
            val shaders = mutableListOf<ShaderDef>()
            val problems = mutableListOf<String>()
            for (file in assets.list("shaders").orEmpty().filter { it.endsWith(".frag") }.sorted()) {
                try {
                    shaders += ShaderSpec.parse(file.removeSuffix(".frag"), read("shaders/$file"))
                } catch (e: ShaderSpec.ParseException) {
                    problems += e.message.orEmpty()
                }
            }
            return ShaderCatalog(
                shaders = shaders,
                problems = problems,
                vertexSource = read("glsl/vertex.glsl"),
                prelude = read("glsl/prelude.glsl"),
                footer = read("glsl/footer.glsl")
            )
        }
    }
}
