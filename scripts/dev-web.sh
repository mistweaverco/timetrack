#!/usr/bin/env bash

# Exit immediately if a command exits with a non-zero status.
set -euo pipefail

./scripts/prepare-web.sh || exit 1

cd web || exit 1

bun run dev || exit 1
