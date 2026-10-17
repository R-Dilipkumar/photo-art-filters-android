package com.artisan.nprstudio.engine

/** One control declared in a shader file header. */
sealed interface ShaderParam {
    val uniform: String
    val label: String

    /** `// @param uName "Label" min max default` → float slider. */
    data class Slider(
        override val uniform: String,
        override val label: String,
        val min: Float,
        val max: Float,
        val default: Float
    ) : ShaderParam

    /** `// @color uName "Label" #RRGGBB` → vec3 colour, stored as 0xRRGGBB. */
    data class ColorPick(
        override val uniform: String,
        override val label: String,
        val default: Int
    ) : ShaderParam

    /** `// @toggle uName "Label" 0|1` → float 0 or 1. */
    data class Toggle(
        override val uniform: String,
        override val label: String,
        val default: Boolean
    ) : ShaderParam

    /** `// @choice uName "Label" "A|B|C" defaultIndex` → float index. */
    data class Choice(
        override val uniform: String,
        override val label: String,
        val options: List<String>,
        val default: Int
    ) : ShaderParam
}

/** A shader file from assets/shaders: metadata from its header plus its GLSL body. */
data class ShaderDef(
    val id: String,
    val name: String,
    val category: String,
    val description: String,
    val params: List<ShaderParam>,
    val body: String
) {
    /** Slider, toggle and choice values, keyed by uniform name. */
    fun defaultValues(): Map<String, Float> = params.mapNotNull { p ->
        when (p) {
            is ShaderParam.Slider -> p.uniform to p.default
            is ShaderParam.Toggle -> p.uniform to if (p.default) 1f else 0f
            is ShaderParam.Choice -> p.uniform to p.default.toFloat()
            is ShaderParam.ColorPick -> null
        }
    }.toMap()

    /** Colour values (0xRRGGBB), keyed by uniform name. */
    fun defaultColors(): Map<String, Int> =
        params.filterIsInstance<ShaderParam.ColorPick>().associate { it.uniform to it.default }
}

/**
 * Parses the `// @tag` header of a shader file. Pure Kotlin so it can be unit-tested;
 * tools/check_shaders.py follows the same rules.
 */
object ShaderSpec {

    private val TAG = Regex("""^\s*//\s*@(\w+)\s*(.*?)\s*$""")
    private const val NUM = """(-?\d+(?:\.\d+)?)"""
    private val PARAM = Regex("""^(\w+)\s+"([^"]+)"\s+$NUM\s+$NUM\s+$NUM$""")
    private val COLOR = Regex("""^(\w+)\s+"([^"]+)"\s+#([0-9a-fA-F]{6})$""")
    private val TOGGLE = Regex("""^(\w+)\s+"([^"]+)"\s+([01])$""")
    private val CHOICE = Regex("""^(\w+)\s+"([^"]+)"\s+"([^"]+)"\s+(\d+)$""")

    class ParseException(message: String) : Exception(message)

    fun parse(id: String, text: String): ShaderDef {
        var name: String? = null
        var category: String? = null
        var description = ""
        val params = mutableListOf<ShaderParam>()

        for (line in text.lineSequence()) {
            val m = TAG.matchEntire(line) ?: continue
            val (tag, rest) = m.destructured
            when (tag) {
                "name" -> name = rest
                "category" -> category = rest
                "desc" -> description = rest
                "param" -> {
                    val g = PARAM.matchEntire(rest)?.groupValues ?: bad(id, tag, rest)
                    val min = g[3].toFloat()
                    val max = g[4].toFloat()
                    val default = g[5].toFloat()
                    if (min >= max || default !in min..max) {
                        throw ParseException("$id: ${g[1]} needs min < max and default inside")
                    }
                    params += ShaderParam.Slider(g[1], g[2], min, max, default)
                }
                "color" -> {
                    val g = COLOR.matchEntire(rest)?.groupValues ?: bad(id, tag, rest)
                    params += ShaderParam.ColorPick(g[1], g[2], g[3].toInt(16))
                }
                "toggle" -> {
                    val g = TOGGLE.matchEntire(rest)?.groupValues ?: bad(id, tag, rest)
                    params += ShaderParam.Toggle(g[1], g[2], g[3] == "1")
                }
                "choice" -> {
                    val g = CHOICE.matchEntire(rest)?.groupValues ?: bad(id, tag, rest)
                    val options = g[3].split('|')
                    val default = g[4].toInt()
                    if (default !in options.indices) throw ParseException("$id: ${g[1]} default out of range")
                    params += ShaderParam.Choice(g[1], g[2], options, default)
                }
                else -> throw ParseException("$id: unknown tag @$tag")
            }
        }
        if (params.map { it.uniform }.toSet().size != params.size) {
            throw ParseException("$id: duplicate uniform name")
        }
        return ShaderDef(
            id = id,
            name = name ?: throw ParseException("$id: missing @name"),
            category = category ?: throw ParseException("$id: missing @category"),
            description = description,
            params = params,
            body = text
        )
    }

    /** prelude + one uniform per control + body (with matching line numbers) + footer. */
    fun buildFragment(prelude: String, def: ShaderDef, footer: String): String = buildString {
        append(prelude).append('\n')
        for (p in def.params) {
            val type = if (p is ShaderParam.ColorPick) "vec3" else "float"
            append("uniform ").append(type).append(' ').append(p.uniform).append(";\n")
        }
        append("#line 1\n")
        append(def.body)
        append(footer)
    }

    private fun bad(id: String, tag: String, rest: String): Nothing =
        throw ParseException("$id: can't read @$tag $rest")
}
