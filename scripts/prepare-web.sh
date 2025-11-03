#!/usr/bin/env bash

# Exit immediately if a command exits with a non-zero status.
set -euo pipefail

if ! command -v magick &> /dev/null
then
    echo "ImageMagick could not be found, please install it to proceed."
    exit 1
fi

if ! command -v bun &> /dev/null
then
    echo "Bun could not be found, please install it to proceed."
    exit 1
fi

# create favicons if they do not exist
if [ ! -f ./web/static/favicon.ico ] || [ ! -f ./web/static/favicon.png ]; then
  magick convert ./assets/logo.png -resize 64x64 ./web/static/favicon.ico || exit
  magick convert ./assets/logo.png -resize 256x256 ./web/static/favicon.png || exit
fi

# copy logos if they do not exist
if [ ! -f ./web/static/logo.png ] || [ ! -f ./web/static/logo.svg ]; then
  cp ./assets/logo.* ./web/static/ || exit 1
fi

# build web
cd web || exit 1
bun install --frozen-lockfile || exit 1
