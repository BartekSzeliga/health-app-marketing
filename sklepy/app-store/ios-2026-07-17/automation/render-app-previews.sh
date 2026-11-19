#!/usr/bin/env bash
set -euo pipefail

ROOT="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"
FFMPEG="$ROOT/.tooling/node_modules/ffmpeg-static/ffmpeg"
FFPROBE="$ROOT/.tooling/node_modules/@ffprobe-installer/darwin-arm64/ffprobe"
RAW="$ROOT/raw"
OUT="$ROOT/app-previews-app-store-aac"
WORK="$(mktemp -d "${TMPDIR:-/tmp}/diecik-app-previews.XXXXXX")"

mkdir -p "$OUT"
rm -f "$OUT"/*.mp4

cleanup() {
  find "$WORK" -type f -delete
  find "$WORK" -depth -type d -empty -delete
}

trap cleanup EXIT

if ! command -v afconvert >/dev/null 2>&1; then
  printf 'Brak systemowego afconvert wymaganego do Apple AAC CBR.\n' >&2
  exit 1
fi

COMMON_VIDEO_ARGS=(
  -an
  -c:v libx264
  -profile:v high
  -level:v 4.0
  -preset medium
  -b:v 10M
  -minrate 10M
  -maxrate 10M
  -bufsize 20M
  -x264-params nal-hrd=cbr:force-cfr=1
  -pix_fmt yuv420p
  -tag:v avc1
  -movflags +faststart
)

add_apple_audio() {
  local input_video="$1"
  local output_video="$2"
  local name="$3"
  local duration
  local wav="$WORK/$name.wav"
  local m4a="$WORK/$name.m4a"

  duration="$(
    "$FFPROBE" \
      -v error \
      -show_entries format=duration \
      -of default=noprint_wrappers=1:nokey=1 \
      "$input_video"
  )"

  "$FFMPEG" -hide_banner -loglevel error -y \
    -f lavfi \
    -i "anullsrc=channel_layout=stereo:sample_rate=48000" \
    -t "$duration" \
    -c:a pcm_s16le \
    "$wav"

  afconvert \
    "$wav" \
    -o "$m4a" \
    -f m4af \
    -d 'aac ' \
    -b 256000 \
    -q 127 \
    -s 0 \
    -c 2

  "$FFMPEG" -hide_banner -loglevel error -y \
    -i "$input_video" \
    -i "$m4a" \
    -map 0:v:0 \
    -map 1:a:0 \
    -c copy \
    -tag:v avc1 \
    -tag:a mp4a \
    -shortest \
    -disposition:v:0 default \
    -disposition:a:0 default \
    -movflags +faststart \
    "$output_video"
}

if [[ -n "${PREVIEW_VIDEO_SOURCE_DIR:-}" ]]; then
  for filename in \
    "01-diecik-overview.mp4" \
    "02-diet-generator.mp4" \
    "03-training-generator.mp4"; do
    if [[ ! -f "$PREVIEW_VIDEO_SOURCE_DIR/$filename" ]]; then
      printf 'Brak mastera wideo: %s\n' "$PREVIEW_VIDEO_SOURCE_DIR/$filename" >&2
      exit 1
    fi

    add_apple_audio \
      "$PREVIEW_VIDEO_SOURCE_DIR/$filename" \
      "$OUT/$filename" \
      "${filename%.mp4}"
  done
  exit 0
fi

"$FFMPEG" -y \
  -i "$RAW/preview-overview-source.mp4" \
  -t 22 \
  -vf "scale=886:-2,crop=886:1920,fps=30,format=yuv420p" \
  "${COMMON_VIDEO_ARGS[@]}" \
  "$WORK/01-diecik-overview-video.mp4"

"$FFMPEG" -y \
  -i "$RAW/preview-diet-source.mp4" \
  -vf "scale=886:-2,crop=886:1920,fps=30,format=yuv420p" \
  "${COMMON_VIDEO_ARGS[@]}" \
  "$WORK/02-diet-generator-video.mp4"

"$FFMPEG" -y \
  -i "$RAW/preview-training-source.mp4" \
  -i "$RAW/preview-training-draft-source.mp4" \
  -filter_complex \
    "[0:v]trim=start=0:end=8,setpts=PTS-STARTPTS,scale=886:-2,crop=886:1920,fps=30,format=yuv420p[v0]; \
     [1:v]trim=start=0:end=18,setpts=PTS-STARTPTS,scale=886:-2,crop=886:1920,fps=30,format=yuv420p[v1]; \
     [v0][v1]concat=n=2:v=1:a=0[outv]" \
  -map "[outv]" \
  "${COMMON_VIDEO_ARGS[@]}" \
  "$WORK/03-training-generator-video.mp4"

add_apple_audio \
  "$WORK/01-diecik-overview-video.mp4" \
  "$OUT/01-diecik-overview.mp4" \
  "01-diecik-overview"

add_apple_audio \
  "$WORK/02-diet-generator-video.mp4" \
  "$OUT/02-diet-generator.mp4" \
  "02-diet-generator"

add_apple_audio \
  "$WORK/03-training-generator-video.mp4" \
  "$OUT/03-training-generator.mp4" \
  "03-training-generator"
