#!/usr/bin/env bash
# Render every shader on a connected phone into contact sheets + a timing table.
#
#   tools/contact_sheets.sh [photo.jpg] [out-dir]
#
# Needs: a phone with USB debugging, the Android SDK (adb). The photo is optional;
# without one the built-in sample picture is used. Output: <out-dir>/contact/*.png
set -euo pipefail
export MSYS_NO_PATHCONV=1   # stop Git Bash on Windows rewriting /sdcard paths

cd "$(dirname "$0")/.."
PHOTO="${1:-}"
OUT="${2:-build/contact}"
SDK_DIR="${ANDROID_HOME:-$(sed -n 's/^sdk\.dir=//p' local.properties | sed 's/\\:/:/g; s/\\\\/\//g')}"
ADB="$SDK_DIR/platform-tools/adb"
APP_FILES=/sdcard/Android/data/com.artisan.nprstudio/files
# adb.exe on Windows wants Windows paths for local files.
native() { if command -v cygpath >/dev/null; then cygpath -w "$1"; else echo "$1"; fi; }

./gradlew -q installDebug installDebugAndroidTest
"$ADB" shell mkdir -p "$APP_FILES"
if [ -n "$PHOTO" ]; then
  "$ADB" push "$(native "$PHOTO")" "$APP_FILES/test_photo.jpg" >/dev/null
fi
"$ADB" shell am instrument -w \
  -e class com.artisan.nprstudio.engine.ContactSheetTest -e contactSheets true \
  com.artisan.nprstudio.test/androidx.test.runner.AndroidJUnitRunner | grep -E "OK|FAIL|Error" || true
mkdir -p "$OUT"
rm -rf "$OUT/contact"
"$ADB" pull "$APP_FILES/contact" "$(native "$OUT")" >/dev/null
"$ADB" pull "$APP_FILES/icon.png" "$(native "$OUT/contact")" >/dev/null 2>&1 || true
echo "Sheets in $OUT/contact"
