package com.artisan.nprstudio.engine

import org.junit.Assert.assertEquals
import org.junit.Assert.assertTrue
import org.junit.Test

class ShaderSpecTest {

    private val sample = """
        // @name Test Shader
        // @category Ink
        // @desc Just a test.
        // @param uWidth "Line Width" 0.5 3.0 1.2
        // @color uInk "Ink" #1A2B3C
        // @toggle uInvert "Invert" 1
        // @choice uMode "Mode" "Soft|Hard|Wild" 2

        vec3 effect(vec2 uv) { return vec3(uWidth); }
    """.trimIndent()

    @Test
    fun readsEveryKindOfControl() {
        val def = ShaderSpec.parse("test", sample)
        assertEquals("Test Shader", def.name)
        assertEquals("Ink", def.category)
        assertEquals("Just a test.", def.description)
        assertEquals(
            listOf(
                ShaderParam.Slider("uWidth", "Line Width", 0.5f, 3.0f, 1.2f),
                ShaderParam.ColorPick("uInk", "Ink", 0x1A2B3C),
                ShaderParam.Toggle("uInvert", "Invert", true),
                ShaderParam.Choice("uMode", "Mode", listOf("Soft", "Hard", "Wild"), 2)
            ),
            def.params
        )
        assertEquals(mapOf("uWidth" to 1.2f, "uInvert" to 1f, "uMode" to 2f), def.defaultValues())
        assertEquals(mapOf("uInk" to 0x1A2B3C), def.defaultColors())
    }

    @Test
    fun declaresUniformsAndKeepsLineNumbers() {
        val def = ShaderSpec.parse("test", sample)
        val src = ShaderSpec.buildFragment("PRELUDE", def, "FOOTER")
        assertTrue(src.startsWith("PRELUDE\n"))
        assertTrue("uniform float uWidth;" in src)
        assertTrue("uniform vec3 uInk;" in src)
        assertTrue("#line 1\n// @name Test Shader" in src)
        assertTrue(src.endsWith("FOOTER"))
    }

    @Test(expected = ShaderSpec.ParseException::class)
    fun rejectsDefaultOutsideRange() {
        ShaderSpec.parse("bad", "// @name X\n// @category Ink\n// @param uA \"A\" 0 1 5\n")
    }

    @Test(expected = ShaderSpec.ParseException::class)
    fun rejectsMissingCategory() {
        ShaderSpec.parse("bad", "// @name X\n")
    }

    @Test(expected = ShaderSpec.ParseException::class)
    fun rejectsDuplicateUniforms() {
        ShaderSpec.parse(
            "bad",
            "// @name X\n// @category Ink\n// @param uA \"A\" 0 1 0.5\n// @toggle uA \"B\" 0\n"
        )
    }
}
