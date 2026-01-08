BIN_NAME = timetrack

macos:
	PLATFORM=macos ./scripts/build.sh

linux:
	PLATFORM=linux ./scripts/build.sh

windows:
	PLATFORM=windows ./scripts/build.sh

linux-release:
	REPLACE=1 PLATFORM=linux ./scripts/release.sh

windows-release:
	REPLACE=1 PLATFORM=windows ./scripts/release.sh

macos-release:
	REPLACE=1 PLATFORM=macos ./scripts/release.sh

version:
	./scripts/set-version.sh

run:
	bun run dev
