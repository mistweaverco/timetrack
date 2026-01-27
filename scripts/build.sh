#!/usr/bin/env bash

if [ -z "$VERSION" ]; then echo "Error: VERSION is not set"; exit 1; fi
if [ -z "$PLATFORM" ]; then echo "Error: PLATFORM is not set"; exit 1; fi

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
