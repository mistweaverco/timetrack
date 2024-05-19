BIN_NAME = timetrack

macos:
	PLATFORM=macos DEBUG=electron-packager ./scripts/build.sh

linux:
	PLATFORM=linux DEBUG=electron-packager ./scripts/build.sh

windows:
	PLATFORM=windows DEBUG=electron-packager ./scripts/build.sh

archives:
	CREATE_ARCHIVES=1 PLATFORM=linux ./scripts/release.sh

linux-release:
	REPLACE=1 PLATFORM=linux ./scripts/release.sh

windows-release:
	REPLACE=1 PLATFORM=windows ./scripts/release.sh

macos-release:
	REPLACE=1 PLATFORM=macos ./scripts/release.sh

version:
	./scripts/set-version.sh

run:
	npm run start
