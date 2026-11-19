#!/bin/sh
set -eu

SCRIPT_DIR=$(CDPATH= cd -- "$(dirname -- "$0")" && pwd)
EXPORT_DIR=$(dirname -- "$SCRIPT_DIR")
OUTPUT_DIR="$EXPORT_DIR/screenshots-phone-1080x1920"
SHARP_DIR="$EXPORT_DIR/../../app-store/ios-2026-07-17/.tooling/node_modules/sharp"

node - "$OUTPUT_DIR" "$SHARP_DIR" <<'NODE'
const fs = require("node:fs");
const path = require("node:path");
const outputDir = process.argv[2];
const sharp = require(process.argv[3]);

(async () => {
  const files = fs.readdirSync(outputDir)
    .filter((name) => /\.(jpe?g)$/i.test(name))
    .sort();

  if (files.length !== 8) {
    throw new Error(`Expected exactly 8 JPEG files, found ${files.length}.`);
  }

  for (const filename of files) {
    const filePath = path.join(outputDir, filename);
    const metadata = await sharp(filePath).metadata();
    const bytes = fs.statSync(filePath).size;
    const exactRatio = metadata.width * 16 === metadata.height * 9;

    if (
      metadata.format !== "jpeg" ||
      metadata.width !== 1080 ||
      metadata.height !== 1920 ||
      !exactRatio ||
      metadata.width < 320 ||
      metadata.height > 3840 ||
      metadata.hasAlpha ||
      bytes > 8 * 1024 * 1024
    ) {
      throw new Error(`${filename}: failed Google Play validation.`);
    }

    process.stdout.write(
      `OK  ${filename}  ${metadata.width}x${metadata.height}  ${(bytes / 1024 / 1024).toFixed(2)} MB\n`,
    );
  }

  process.stdout.write("PASS: 8/8 assets satisfy the Google Play phone screenshot requirements.\n");
})().catch((error) => {
  console.error(error.message);
  process.exit(1);
});
NODE
