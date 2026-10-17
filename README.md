# Artisan NPR Studio

Turn your photos into pencil sketches, ink drawings, oil paintings and more, right on your phone. Fully offline, with no AI models.

![License: MIT](https://img.shields.io/badge/license-MIT-blue.svg)
![Platform: Android 10+](https://img.shields.io/badge/platform-Android%2010%2B-3DDC84.svg)
![Kotlin](https://img.shields.io/badge/Kotlin-Jetpack%20Compose-7F52FF.svg)
![Status: early development](https://img.shields.io/badge/status-early%20development-orange.svg)

## Features

- 8 art styles: Graphite Sketch, Charcoal & Ink, Classic Oil Paint, Smearing Paint, Wet Watercolor, Cross-Hatching, Pointillism, Impasto Knife 3D
- 3 sliders per style, with a live preview
- Press and hold the image to compare it with the original
- Export a high-resolution copy to `Pictures/ArtisanNPR`
- Works with no internet and no special permissions

## Download

No release yet. The app is still in early development. Build it from source for now (see below).

## How it works

Each style is a small GPU program (an OpenGL ES 3.0 shader) that runs a classic image-art algorithm. Examples are colour-dodge sketching, Difference-of-Gaussians edges, and the Kuwahara filter. One background GPU thread keeps everything loaded, so a slider move only redraws the image.

## Good to know

- Needs Android 10 or newer and a GPU with OpenGL ES 3.0 (almost every phone from the last 8+ years).
- Preview runs at up to 1280 px. Export runs at up to 3200 px, or the GPU's limit if that is smaller.
- Some styles still look different at export size than in the preview. That fix is planned (see `AUDIT.md`).

## Build from source

Requirements: JDK 17+ and the Android SDK (platform 36). The NDK is optional; it is only used by the shader check.

```bash
./gradlew assembleDebug
```

The APK is written to `app/build/outputs/apk/debug/`.

Check that every shader compiles (uses `glslc` from the Android NDK):

```bash
python tools/check_shaders.py
```

Run the on-device GPU tests (needs a phone or emulator):

```bash
./gradlew connectedDebugAndroidTest
```

## License

MIT. See [LICENSE](LICENSE).
