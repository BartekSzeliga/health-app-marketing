#!/usr/bin/env bash

# Read-only validation for the production App Store media set.
# Usage:
#   ./validate-assets.sh [screenshots-directory] [app-previews-directory]
#
# Optional overrides for a different screenshot target:
#   SCREENSHOT_WIDTH=1242 SCREENSHOT_HEIGHT=2688 ./validate-assets.sh

set -uo pipefail

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
EXPORT_DIR="$(cd "$SCRIPT_DIR/.." && pwd)"
TOOLING_DIR="$EXPORT_DIR/.tooling"
FFMPEG="$TOOLING_DIR/node_modules/ffmpeg-static/ffmpeg"
FFPROBE="$TOOLING_DIR/node_modules/@ffprobe-installer/darwin-arm64/ffprobe"

SCREENSHOT_DIR="${1:-$EXPORT_DIR/screenshots-app-store-1284x2778}"
PREVIEW_DIR="${2:-$EXPORT_DIR/app-previews-app-store-aac}"

EXPECTED_SCREENSHOTS=10
EXPECTED_PREVIEWS=3
SCREENSHOT_WIDTH="${SCREENSHOT_WIDTH:-1284}"
SCREENSHOT_HEIGHT="${SCREENSHOT_HEIGHT:-2778}"
PREVIEW_WIDTH=886
PREVIEW_HEIGHT=1920
MAX_PREVIEW_BYTES=500000000

errors=0
warnings=0

ok() {
  printf 'OK   %s\n' "$1"
}

fail() {
  printf 'FAIL %s\n' "$1" >&2
  errors=$((errors + 1))
}

warn() {
  printf 'WARN %s\n' "$1" >&2
  warnings=$((warnings + 1))
}

value_from_probe() {
  local key="$1"
  local probe_output="$2"
  printf '%s\n' "$probe_output" | awk -F= -v key="$key" '$1 == key { print substr($0, length(key) + 2); exit }'
}

rate_is_valid() {
  local rate="$1"
  awk -v rate="$rate" '
    BEGIN {
      split(rate, parts, "/")
      denominator = (parts[2] == "" ? 1 : parts[2])
      if (denominator == 0) exit 1
      fps = parts[1] / denominator
      exit !(fps > 0 && fps <= 30.0001)
    }
  '
}

if [[ ! -x "$FFMPEG" ]]; then
  fail "Brak wykonywalnego ffmpeg: $FFMPEG"
else
  ok "ffmpeg jest dostępny"
fi

if [[ ! -x "$FFPROBE" ]]; then
  fail "Brak wykonywalnego ffprobe ARM64: $FFPROBE"
else
  ok "ffprobe ARM64 jest dostępny"
fi

if [[ ! -d "$SCREENSHOT_DIR" ]]; then
  fail "Brak katalogu screenshotów: $SCREENSHOT_DIR"
fi

if [[ ! -d "$PREVIEW_DIR" ]]; then
  fail "Brak katalogu App Preview: $PREVIEW_DIR"
fi

if (( errors > 0 )); then
  printf '\nWalidacja przerwana: brak wymaganych katalogów lub narzędzi.\n' >&2
  exit 1
fi

shopt -s nullglob

screenshot_files=()
for file in "$SCREENSHOT_DIR"/*; do
  [[ -f "$file" ]] || continue
  filename="$(basename "$file")"
  extension="${filename##*.}"
  extension="$(printf '%s' "$extension" | tr '[:upper:]' '[:lower:]')"

  case "$extension" in
    jpg|jpeg|png)
      screenshot_files+=("$file")
      ;;
    *)
      fail "Nieobsługiwany plik w katalogu screenshotów: $filename"
      ;;
  esac
done

if (( ${#screenshot_files[@]} != EXPECTED_SCREENSHOTS )); then
  fail "Liczba screenshotów: ${#screenshot_files[@]} (wymagane: $EXPECTED_SCREENSHOTS)"
else
  ok "Liczba screenshotów: $EXPECTED_SCREENSHOTS"
fi

for file in "${screenshot_files[@]}"; do
  filename="$(basename "$file")"
  image_info="$(sips -g format -g pixelWidth -g pixelHeight -g hasAlpha "$file" 2>/dev/null)"
  image_format="$(printf '%s\n' "$image_info" | awk '/format:/ { print $2; exit }')"
  width="$(printf '%s\n' "$image_info" | awk '/pixelWidth:/ { print $2; exit }')"
  height="$(printf '%s\n' "$image_info" | awk '/pixelHeight:/ { print $2; exit }')"
  has_alpha="$(printf '%s\n' "$image_info" | awk '/hasAlpha:/ { print $2; exit }')"

  case "$image_format" in
    jpeg|png) ;;
    *)
      fail "$filename: format obrazu '$image_format' nie jest JPEG/PNG"
      ;;
  esac

  if [[ "$width" != "$SCREENSHOT_WIDTH" || "$height" != "$SCREENSHOT_HEIGHT" ]]; then
    fail "$filename: rozdzielczość ${width:-?}x${height:-?} (wymagane: ${SCREENSHOT_WIDTH}x${SCREENSHOT_HEIGHT})"
  fi

  if [[ "$has_alpha" != "no" ]]; then
    fail "$filename: kanał alpha jest obecny lub nie udało się go wykluczyć (hasAlpha=${has_alpha:-?})"
  fi

  if [[ "$image_format" =~ ^(jpeg|png)$ ]] &&
     [[ "$width" == "$SCREENSHOT_WIDTH" && "$height" == "$SCREENSHOT_HEIGHT" ]] &&
     [[ "$has_alpha" == "no" ]]; then
    ok "$filename: $image_format, ${width}x${height}, bez alpha"
  fi
done

preview_files=()
for file in "$PREVIEW_DIR"/*; do
  [[ -f "$file" ]] || continue
  filename="$(basename "$file")"
  extension="${filename##*.}"
  extension="$(printf '%s' "$extension" | tr '[:upper:]' '[:lower:]')"

  case "$extension" in
    mov|m4v|mp4)
      preview_files+=("$file")
      ;;
    *)
      fail "Nieobsługiwany plik w katalogu App Preview: $filename"
      ;;
  esac
done

if (( ${#preview_files[@]} != EXPECTED_PREVIEWS )); then
  fail "Liczba App Preview: ${#preview_files[@]} (wymagane: $EXPECTED_PREVIEWS)"
else
  ok "Liczba App Preview: $EXPECTED_PREVIEWS"
fi

for file in "${preview_files[@]}"; do
  filename="$(basename "$file")"
  probe_output="$(
    "$FFPROBE" \
      -v error \
      -select_streams v:0 \
      -show_entries 'stream=codec_name,profile,level,bit_rate,width,height,avg_frame_rate,r_frame_rate,field_order:format=duration,size' \
      -of default=noprint_wrappers=1 \
      "$file" 2>/dev/null
  )"

  if [[ -z "$probe_output" ]]; then
    fail "$filename: ffprobe nie znalazł strumienia wideo"
    continue
  fi

  codec="$(value_from_probe codec_name "$probe_output")"
  profile="$(value_from_probe profile "$probe_output")"
  level="$(value_from_probe level "$probe_output")"
  bit_rate="$(value_from_probe bit_rate "$probe_output")"
  width="$(value_from_probe width "$probe_output")"
  height="$(value_from_probe height "$probe_output")"
  avg_rate="$(value_from_probe avg_frame_rate "$probe_output")"
  nominal_rate="$(value_from_probe r_frame_rate "$probe_output")"
  field_order="$(value_from_probe field_order "$probe_output")"
  duration="$(value_from_probe duration "$probe_output")"
  size="$(value_from_probe size "$probe_output")"

  file_ok=1

  audio_stream_count="$(
    "$FFPROBE" \
      -v error \
      -select_streams a \
      -show_entries stream=index \
      -of csv=p=0 \
      "$file" 2>/dev/null |
      awk 'NF { count += 1 } END { print count + 0 }'
  )"

  if [[ "$audio_stream_count" != "1" ]]; then
    fail "$filename: liczba ścieżek audio $audio_stream_count (wymagana dokładnie 1)"
    file_ok=0
    audio_probe=""
  else
    audio_probe="$(
      "$FFPROBE" \
        -v error \
        -select_streams a:0 \
        -show_entries 'stream=codec_name,profile,codec_tag_string,sample_rate,channels,channel_layout,bit_rate,start_time,duration:stream_disposition=default' \
        -of default=noprint_wrappers=1 \
        "$file" 2>/dev/null
    )"
  fi

  audio_codec="$(value_from_probe codec_name "$audio_probe")"
  audio_profile="$(value_from_probe profile "$audio_probe")"
  audio_tag="$(value_from_probe codec_tag_string "$audio_probe")"
  audio_sample_rate="$(value_from_probe sample_rate "$audio_probe")"
  audio_channels="$(value_from_probe channels "$audio_probe")"
  audio_layout="$(value_from_probe channel_layout "$audio_probe")"
  audio_bit_rate="$(value_from_probe bit_rate "$audio_probe")"
  audio_start_time="$(value_from_probe start_time "$audio_probe")"
  audio_duration="$(value_from_probe duration "$audio_probe")"
  audio_default="$(value_from_probe 'DISPOSITION:default' "$audio_probe")"

  if [[ "$codec" != "h264" ]]; then
    fail "$filename: kodek '$codec' (wymagany: H.264)"
    file_ok=0
  fi

  if [[ "$profile" != "High" ]]; then
    fail "$filename: profil '$profile' (wymagany: H.264 High)"
    file_ok=0
  fi

  if [[ ! "$level" =~ ^[0-9]+$ ]] || (( level > 40 )); then
    fail "$filename: poziom H.264 ${level:-?} (maksimum Apple: 4.0)"
    file_ok=0
  fi

  if [[ ! "$bit_rate" =~ ^[0-9]+$ ]] || (( bit_rate < 9000000 || bit_rate > 12500000 )); then
    fail "$filename: bitrate ${bit_rate:-?} b/s (cel Apple: 10–12 Mb/s)"
    file_ok=0
  fi

  if [[ "$width" != "$PREVIEW_WIDTH" || "$height" != "$PREVIEW_HEIGHT" ]]; then
    fail "$filename: rozdzielczość ${width:-?}x${height:-?} (wymagane: ${PREVIEW_WIDTH}x${PREVIEW_HEIGHT})"
    file_ok=0
  fi

  if ! rate_is_valid "$avg_rate" || ! rate_is_valid "$nominal_rate"; then
    fail "$filename: klatkaż avg=$avg_rate, nominal=$nominal_rate (wymagane: >0 i <=30 fps)"
    file_ok=0
  fi

  if ! awk -v duration="$duration" 'BEGIN { exit !(duration >= 15 && duration <= 30) }'; then
    fail "$filename: czas ${duration:-?} s (wymagane: 15–30 s)"
    file_ok=0
  fi

  if [[ ! "$size" =~ ^[0-9]+$ ]] || (( size > MAX_PREVIEW_BYTES )); then
    fail "$filename: rozmiar ${size:-?} B (maksimum: $MAX_PREVIEW_BYTES B)"
    file_ok=0
  fi

  is_progressive=0
  if [[ "$field_order" == "progressive" ]]; then
    is_progressive=1
  elif [[ "$field_order" == "unknown" ]]; then
    # The bundled ffprobe 4.4 reports `unknown` for progressive x264 streams.
    # Verify the decoded stream descriptor with ffmpeg 6 before rejecting it.
    scan_output="$("$FFMPEG" -hide_banner -i "$file" -frames:v 1 -f null - 2>&1)"
    if printf '%s\n' "$scan_output" | grep -Eq 'Video:.*progressive'; then
      is_progressive=1
    fi
  fi

  if (( is_progressive != 1 )); then
    fail "$filename: obraz nie jest progressive (field_order=${field_order:-?})"
    file_ok=0
  fi

  if [[ "$audio_codec" != "aac" || "$audio_profile" != "LC" || "$audio_tag" != "mp4a" ]]; then
    fail "$filename: audio ${audio_codec:-?}/${audio_profile:-?}/${audio_tag:-?} (wymagane: AAC-LC/mp4a)"
    file_ok=0
  fi

  if [[ "$audio_sample_rate" != "44100" && "$audio_sample_rate" != "48000" ]]; then
    fail "$filename: sample rate audio ${audio_sample_rate:-?} Hz (wymagane: 44100 lub 48000 Hz)"
    file_ok=0
  fi

  if [[ "$audio_channels" != "2" || "$audio_layout" != "stereo" ]]; then
    fail "$filename: audio ${audio_channels:-?} kanałów, layout ${audio_layout:-?} (wymagane stereo 2.0)"
    file_ok=0
  fi

  if [[ ! "$audio_bit_rate" =~ ^[0-9]+$ ]] ||
     (( audio_bit_rate < 240000 || audio_bit_rate > 270000 )); then
    fail "$filename: bitrate audio ${audio_bit_rate:-?} b/s (wymagane około 256 kb/s)"
    file_ok=0
  fi

  if [[ "$audio_default" != "1" ]]; then
    fail "$filename: ścieżka audio nie jest włączona jako default"
    file_ok=0
  fi

  if ! awk -v start="${audio_start_time:-999}" 'BEGIN { exit !(start >= 0 && start <= 0.05) }'; then
    fail "$filename: początek audio ${audio_start_time:-?} s (wymagane 0–0,05 s)"
    file_ok=0
  fi

  if ! awk -v video="${duration:-0}" -v audio="${audio_duration:-999}" '
    BEGIN {
      difference = video - audio
      if (difference < 0) difference = -difference
      exit !(difference <= 0.1)
    }
  '; then
    fail "$filename: czas audio ${audio_duration:-?} s nie zgadza się z wideo ${duration:-?} s"
    file_ok=0
  fi

  if ! decode_output="$(
    "$FFMPEG" \
      -v error \
      -i "$file" \
      -map 0:v:0 \
      -map 0:a:0 \
      -f null \
      - 2>&1
  )"; then
    fail "$filename: pełny decode audio/wideo nie przeszedł: ${decode_output:-brak szczegółów}"
    file_ok=0
  fi

  if (( file_ok == 1 )); then
    size_mb="$(awk -v bytes="$size" 'BEGIN { printf "%.2f", bytes / 1000000 }')"
    fps="$(awk -v rate="$avg_rate" 'BEGIN { split(rate, p, "/"); printf "%.3f", p[1] / p[2] }')"
    mbps="$(awk -v bits="$bit_rate" 'BEGIN { printf "%.2f", bits / 1000000 }')"
    audio_kbps="$(awk -v bits="$audio_bit_rate" 'BEGIN { printf "%.0f", bits / 1000 }')"
    ok "$filename: H.264 High 4.0, ${width}x${height}, ${fps} fps, ${duration} s, ${mbps} Mb/s, AAC-LC stereo ${audio_sample_rate} Hz ${audio_kbps} kb/s, ${size_mb} MB, progressive"
  fi
done

printf '\nPodsumowanie: %d błędów, %d ostrzeżeń.\n' "$errors" "$warnings"

if (( errors > 0 )); then
  exit 1
fi

printf 'Zestaw spełnia sprawdzane wymagania App Store.\n'
