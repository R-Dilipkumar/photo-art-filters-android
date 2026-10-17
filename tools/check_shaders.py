"""Compile every GLSL shader in ShaderLibrary.kt with the NDK's glslc. Exits 1 on any error.

Usage:  python tools/check_shaders.py

glslc only compiles ES shaders at version 310+, so "#version 300 es" is bumped to
"310 es" for the check. The type rules are the same, so 300-es errors still show up.
"""
import os
import re
import subprocess
import sys
import tempfile
from pathlib import Path

ROOT = Path(__file__).resolve().parent.parent
LIBRARY = ROOT / "app/src/main/java/com/artisan/nprstudio/engine/ShaderLibrary.kt"


def find_glslc() -> Path:
    sdk = os.environ.get("ANDROID_HOME") or os.environ.get("ANDROID_SDK_ROOT")
    if not sdk:
        props = ROOT / "local.properties"
        if props.exists():
            m = re.search(r"^sdk\.dir=(.*)$", props.read_text(), re.M)
            if m:
                sdk = m.group(1).replace("\\:", ":").replace("\\\\", "\\")
    if not sdk:
        sys.exit("Android SDK not found: set ANDROID_HOME or sdk.dir in local.properties")
    exe = "glslc.exe" if os.name == "nt" else "glslc"
    hits = sorted((Path(sdk) / "ndk").glob(f"*/shader-tools/*/{exe}"))
    if not hits:
        sys.exit(f"glslc not found under {sdk}/ndk (install an NDK)")
    return hits[-1]


def raw_string(src: str, name: str) -> str:
    m = re.search(rf"\b{name}\s*=\s*(?:COMMON_HEADER\s*\+\s*)?\"\"\"(.*?)\"\"\"", src, re.S)
    if not m:
        sys.exit(f"{name} not found in {LIBRARY.name}")
    return m.group(1)


def main() -> int:
    src = LIBRARY.read_text(encoding="utf-8")
    header = raw_string(src, "COMMON_HEADER")
    shaders = {"VERTEX_SHADER.vert": raw_string(src, "VERTEX_SHADER")}
    for name in re.findall(r"\b(\w+_SHADER)\s*=\s*COMMON_HEADER\s*\+", src):
        shaders[f"{name}.frag"] = header + raw_string(src, name)

    glslc = find_glslc()
    failed = 0
    with tempfile.TemporaryDirectory() as tmp:
        for file_name, code in shaders.items():
            path = Path(tmp) / file_name
            path.write_text(code.lstrip().replace("#version 300 es", "#version 310 es", 1))
            result = subprocess.run(
                [str(glslc), "--target-env=opengl", "-fauto-map-locations",
                 "-fauto-bind-uniforms", "-o", os.devnull, str(path)],
                capture_output=True, text=True,
            )
            if result.returncode == 0:
                print(f"OK    {file_name}")
            else:
                failed += 1
                print(f"FAIL  {file_name}\n{result.stderr.strip()}")
    print(f"\n{len(shaders) - failed}/{len(shaders)} shaders compile")
    return 1 if failed else 0


if __name__ == "__main__":
    sys.exit(main())
