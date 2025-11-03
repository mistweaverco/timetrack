#!/usr/bin/env bash

# Exit immediately if a command exits with a non-zero status.
set -euo pipefail

IMAGEMAGICK_FOUND=false
IMAGEMAGICK_VERSION="nok"

# Newer versions of ImageMagick use the 'magick' command
if command -v magick &> /dev/null
then
  IMAGEMAGICK_FOUND=true
  IMAGEMAGICK_VERSION="ok"
fi

# Older versions of ImageMagick use the 'convert' command
if command -v convert &> /dev/null
then
  IMAGEMAGICK_FOUND=true
  IMAGEMAGICK_VERSION="nok"
fi

# Check if ImageMagick is found
if ! $IMAGEMAGICK_FOUND
then
    echo "ImageMagick could not be found, please install it to proceed."
    exit 1
fi

# Check if Bun is installed
if ! command -v bun &> /dev/null
then
    echo "Bun could not be found, please install it to proceed."
    exit 1
fi

# create favicons if they do not exist
if [ ! -f ./web/static/favicon.ico ] || [ ! -f ./web/static/favicon.png ]; then
  if [ "$IMAGEMAGICK_VERSION" = "ok" ]; then
    magick convert ./assets/logo.png -resize 64x64 ./web/static/favicon.ico || exit 1
    magick convert ./assets/logo.png -resize 256x256 ./web/static/favicon.png || exit 1
  else
    convert ./assets/logo.png -resize 64x64 ./web/static/favicon.ico || exit 1
    convert ./assets/logo.png -resize 256x256 ./web/static/favicon.png || exit 1
  fi
fi

# copy logos if they do not exist
if [ ! -f ./web/static/logo.png ] || [ ! -f ./web/static/logo.svg ]; then
  cp ./assets/logo.* ./web/static/ || exit 1
fi

# build web
cd web || exit 1
bun install --frozen-lockfile || exit 1
