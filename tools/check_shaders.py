"""Check every shader in app/src/main/assets/shaders: header metadata + GLSL compile.

Usage:
    python tools/check_shaders.py            # all shaders
    python tools/check_shaders.py pencil     # only ids containing "pencil"

Each shader is built exactly like the app does it:
    prelude.glsl + one uniform per @param/@color/@toggle/@choice + the file + footer.glsl
then compiled with glslc from the Android NDK. glslc only accepts ES 310+, so
"#version 300 es" is bumped to "310 es" for the check; the type rules are the same.
Exits 1 if anything fails.
"""
import os
import re
import subprocess
import sys
import tempfile
from pathlib import Path

ROOT = Path(__file__).resolve().parent.parent
ASSETS = ROOT / "app/src/main/assets"
SHADERS = ASSETS / "shaders"

CATEGORIES = [
    "Sketch", "Ink", "Paint", "Watercolor", "Print", "Comic & Pop",
    "Mosaic", "Retro", "Film", "Glitch & Neon", "Distort", "Stylize",
]

TAG = re.compile(r"^\s*//\s*@(\w+)\s*(.*?)\s*$")
NUM = r"(-?\d+(?:\.\d+)?)"
PARAM = re.compile(rf'^(\w+)\s+"([^"]+)"\s+{NUM}\s+{NUM}\s+{NUM}$')
COLOR = re.compile(r'^(\w+)\s+"([^"]+)"\s+#([0-9a-fA-F]{6})$')
TOGGLE = re.compile(r'^(\w+)\s+"([^"]+)"\s+([01])$')
CHOICE = re.compile(r'^(\w+)\s+"([^"]+)"\s+"([^"]+)"\s+(\d+)$')


def parse(path: Path):
    """Returns (meta dict, uniform declarations, list of problems)."""
    meta = {"name": None, "category": None, "params": []}
    problems = []
    decls = []
    names = set()
    for line in path.read_text(encoding="utf-8").splitlines():
        m = TAG.match(line)
        if not m:
            continue
        tag, rest = m.group(1), m.group(2)
        if tag in ("name", "category", "desc"):
            meta[tag] = rest
            continue
        pattern = {"param": PARAM, "color": COLOR, "toggle": TOGGLE, "choice": CHOICE}.get(tag)
        if pattern is None:
            problems.append(f"unknown tag @{tag}")
            continue
        pm = pattern.match(rest)
        if not pm:
            problems.append(f"bad @{tag} line: {rest}")
            continue
        uniform = pm.group(1)
        if uniform in names:
            problems.append(f"duplicate uniform {uniform}")
        names.add(uniform)
        if tag == "param":
            lo, hi, default = (float(pm.group(i)) for i in (3, 4, 5))
            if not lo < hi:
                problems.append(f"{uniform}: min must be < max")
            if not lo <= default <= hi:
                problems.append(f"{uniform}: default {default} outside {lo}..{hi}")
            decls.append(f"uniform float {uniform};")
        elif tag == "color":
            decls.append(f"uniform vec3 {uniform};")
        elif tag == "toggle":
            decls.append(f"uniform float {uniform};")
        else:
            options = pm.group(3).split("|")
            if int(pm.group(4)) >= len(options):
                problems.append(f"{uniform}: default choice out of range")
            decls.append(f"uniform float {uniform};")
        meta["params"].append(uniform)
    if not meta["name"]:
        problems.append("missing @name")
    if not meta["category"]:
        problems.append("missing @category")
    elif meta["category"] not in CATEGORIES:
        problems.append(f"category '{meta['category']}' is new (allowed, but check spelling)")
    if len(meta["params"]) > 8:
        problems.append("more than 8 controls")
    return meta, decls, problems


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


def main() -> int:
    only = sys.argv[1] if len(sys.argv) > 1 else ""
    prelude = (ASSETS / "glsl/prelude.glsl").read_text(encoding="utf-8")
    footer = (ASSETS / "glsl/footer.glsl").read_text(encoding="utf-8")
    vertex = (ASSETS / "glsl/vertex.glsl").read_text(encoding="utf-8")
    glslc = find_glslc()
    files = sorted(p for p in SHADERS.glob("*.frag") if only in p.stem)

    failed = 0
    per_category = {}
    with tempfile.TemporaryDirectory() as tmp:
        jobs = [("vertex.vert", vertex, [])]
        for f in files:
            meta, decls, problems = parse(f)
            per_category[meta["category"]] = per_category.get(meta["category"], 0) + 1
            code = prelude + "\n" + "\n".join(decls) + "\n#line 1\n" + f.read_text(encoding="utf-8") + footer
            jobs.append((f.stem + ".frag", code, problems))
        for name, code, problems in jobs:
            path = Path(tmp) / name
            path.write_text(code.replace("#version 300 es", "#version 310 es", 1), encoding="utf-8")
            r = subprocess.run(
                [str(glslc), "--target-env=opengl", "-fauto-map-locations",
                 "-fauto-bind-uniforms", "-o", os.devnull, str(path)],
                capture_output=True, text=True,
            )
            hard = [p for p in problems if "is new" not in p]
            if r.returncode == 0 and not hard:
                note = f"  ({'; '.join(problems)})" if problems else ""
                print(f"OK    {name}{note}")
            else:
                failed += 1
                print(f"FAIL  {name}")
                for p in problems:
                    print(f"      {p}")
                if r.returncode != 0:
                    # Point errors at the .frag line numbers (thanks to #line 1).
                    print("      " + r.stderr.strip().replace(str(path), name).replace("\n", "\n      "))
    total = len(files)
    print(f"\n{total - failed + 1}/{total + 1} compile (incl. vertex shader); {total} shaders")
    for cat in CATEGORIES + sorted(c for c in per_category if c not in CATEGORIES):
        if cat in per_category:
            print(f"  {cat:<14} {per_category[cat]}")
    return 1 if failed else 0


if __name__ == "__main__":
    sys.exit(main())
