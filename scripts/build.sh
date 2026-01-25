#!/usr/bin/env bash

if [ -z "$VERSION" ]; then echo "Error: VERSION is not set"; exit 1; fi
if [ -z "$PLATFORM" ]; then echo "Error: PLATFORM is not set"; exit 1; fi

generate_icons() {
  local source_icon="build/icon.png"
  local output_dir="build/icons"

  mkdir -p $output_dir

  # Array of sizes required for Linux/AppImage compatibility
  local sizes=(16 32 48 64 128 256 512 1024)

  echo "Generating icons from $source_icon..."

  for SIZE in "${sizes[@]}"; do
      dest="$output_dir/${SIZE}x${SIZE}.png"
      magick "$source_icon" -resize "${SIZE}x${SIZE}" "$dest"
      echo "Created: $dest"
  done
}

update_package_json_version() {
  local tmp
  tmp=$(mktemp)
  jq --arg v "$VERSION" '.version = $v' package.json > "$tmp" && mv "$tmp" package.json
}

update_package_json_version
generate_icons

build_windows() {
  bun run build && bunx electron-builder --win --publish never
}

build_linux() {
  bun run build && bunx electron-builder --linux --publish never
}

build_macos() {
  bun run build && bunx electron-builder --mac --publish never
}

case $PLATFORM in
  "linux")
    build_linux
    ;;
  "macos")
    build_macos
    ;;
  "windows")
    build_windows
    ;;
  *)
    echo "Error: PLATFORM $PLATFORM is not supported"
    exit 1
    ;;
esac
