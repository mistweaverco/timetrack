BIN_NAME = timetrack.desktop

macos:
	npm run make -- --arch=x64 --platform=darwin

linux:
	npm run make -- --arch=x64 --platform=linux

windows:
	npm run make -- --arch=x64 --platform=win32

archives:
	cd out/ && tar -czvf $(BIN_NAME)_$(VERSION)_linux-x64.tar.gz $(BIN_NAME)-linux-x64

default-release:
	gh release create --generate-notes v$(VERSION) out/make/deb/x64/$(BIN_NAME)_$(VERSION)_amd64.deb out/make/rpm/x64/$(BIN_NAME)-$(VERSION)-1.x86_64.rpm "out/make/squirrel.windows/x64/timetrack.desktop-$(VERSION) Setup.exe" out/make/squirrel.windows/x64/timetrack.desktop-$(VERSION)-full.nupkg
macos-release:
	tree out/
	# gh release edit v$(VERSION)
