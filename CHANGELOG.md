## 5.12.0 (2026-03-19)

* feat(ux): add CHANGELOG.md ([1a70aa2](https://github.com/mistweaverco/timetrack/commit/1a70aa2))
* feat(web): add screenshots + direct download links (#76) ([c8c2fe7](https://github.com/mistweaverco/timetrack/commit/c8c2fe7)), closes [#76](https://github.com/mistweaverco/timetrack/issues/76)
* fix(ui): dropdown re-selection always picks first task from today (#75) ([a7e69a6](https://github.com/mistweaverco/timetrack/commit/a7e69a6)), closes [#75](https://github.com/mistweaverco/timetrack/issues/75)
* fix(ui): hide "start" task, when it's already running (#74) ([72dab59](https://github.com/mistweaverco/timetrack/commit/72dab59)), closes [#74](https://github.com/mistweaverco/timetrack/issues/74)

## 5.11.0 (2026-03-06)

* feat(search): add stats and improve pdf export (#73) ([8726abf](https://github.com/mistweaverco/timetrack/commit/8726abf)), closes [#73](https://github.com/mistweaverco/timetrack/issues/73)

## <small>5.10.1 (2026-03-05)</small>

* fix(export): pdf export and styling (#72) ([a40832d](https://github.com/mistweaverco/timetrack/commit/a40832d)), closes [#72](https://github.com/mistweaverco/timetrack/issues/72)

## 5.10.0 (2026-03-04)

* fix(tasks): time picker is now 24h instead of am/pm (#71) ([25c9077](https://github.com/mistweaverco/timetrack/commit/25c9077)), closes [#71](https://github.com/mistweaverco/timetrack/issues/71)
* Feat/editable running task description (#70) ([4d0a46a](https://github.com/mistweaverco/timetrack/commit/4d0a46a)), closes [#70](https://github.com/mistweaverco/timetrack/issues/70)

## 5.9.0 (2026-03-03)

* chore: update app's node packages / dependencies (#68) ([11b823f](https://github.com/mistweaverco/timetrack/commit/11b823f)), closes [#68](https://github.com/mistweaverco/timetrack/issues/68)
* feat(db): save datetime start and end, instead of just date and seconds (#67) ([aa08cde](https://github.com/mistweaverco/timetrack/commit/aa08cde)), closes [#67](https://github.com/mistweaverco/timetrack/issues/67)
* fix(web): update node packages (#66) ([0a46a27](https://github.com/mistweaverco/timetrack/commit/0a46a27)), closes [#66](https://github.com/mistweaverco/timetrack/issues/66)

## 5.8.0 (2026-02-10)

* feat(search+export): more markdown stylings (#64) ([0c27539](https://github.com/mistweaverco/timetrack/commit/0c27539)), closes [#64](https://github.com/mistweaverco/timetrack/issues/64)

## <small>5.7.1 (2026-02-10)</small>

* fix(search+export): markdown description in tasks (#63) ([804e134](https://github.com/mistweaverco/timetrack/commit/804e134)), closes [#63](https://github.com/mistweaverco/timetrack/issues/63)

## 5.7.0 (2026-02-10)

* feat(search+export): support markdown description in tasks (#62) ([ed4bb3c](https://github.com/mistweaverco/timetrack/commit/ed4bb3c)), closes [#62](https://github.com/mistweaverco/timetrack/issues/62)

## <small>5.6.3 (2026-02-10)</small>

* fix(search): when company is selected (#61) ([dc11ae7](https://github.com/mistweaverco/timetrack/commit/dc11ae7)), closes [#61](https://github.com/mistweaverco/timetrack/issues/61)

## <small>5.6.2 (2026-02-10)</small>

* fix(config): auto select db if only one db exists (#60) ([58589b4](https://github.com/mistweaverco/timetrack/commit/58589b4)), closes [#60](https://github.com/mistweaverco/timetrack/issues/60)

## <small>5.6.1 (2026-02-10)</small>

* fix(db): change driver + add migrations + fix dates in db (#59) ([872b3ea](https://github.com/mistweaverco/timetrack/commit/872b3ea)), closes [#59](https://github.com/mistweaverco/timetrack/issues/59)
* fix(db): timestamp and date mess in Tasks table (#57) ([3b72619](https://github.com/mistweaverco/timetrack/commit/3b72619)), closes [#57](https://github.com/mistweaverco/timetrack/issues/57)

## 5.6.0 (2026-01-27)

* feat(search+export): filter by company + csv export + company to output (#56) ([8c6cb00](https://github.com/mistweaverco/timetrack/commit/8c6cb00)), closes [#56](https://github.com/mistweaverco/timetrack/issues/56)

## 5.5.0 (2026-01-27)

* fix(build): icns (#52) ([45dad63](https://github.com/mistweaverco/timetrack/commit/45dad63)), closes [#52](https://github.com/mistweaverco/timetrack/issues/52)
* fix(ci): web build script and syntax error in app build script (#51) ([e973e4b](https://github.com/mistweaverco/timetrack/commit/e973e4b)), closes [#51](https://github.com/mistweaverco/timetrack/issues/51)
* fix(TimerComponent): derived state (#53) ([94a0f78](https://github.com/mistweaverco/timetrack/commit/94a0f78)), closes [#53](https://github.com/mistweaverco/timetrack/issues/53)
* fix(web): build ([eb74dd6](https://github.com/mistweaverco/timetrack/commit/eb74dd6))
* bug(TimerCompoenent): fetch time from backend after restore + new icon (#50) ([1e166de](https://github.com/mistweaverco/timetrack/commit/1e166de)), closes [#50](https://github.com/mistweaverco/timetrack/issues/50)

## 5.4.0 (2026-01-25)

* feat(app): move projects incl. tasks ([317cb35](https://github.com/mistweaverco/timetrack/commit/317cb35))

## 5.3.0 (2026-01-25)

* feat(app): auto activate inactive items on creation (#47) ([592a2e4](https://github.com/mistweaverco/timetrack/commit/592a2e4)), closes [#47](https://github.com/mistweaverco/timetrack/issues/47)

## 5.2.0 (2026-01-24)

* fix(ui): await onSuccess in modals ([c64ace2](https://github.com/mistweaverco/timetrack/commit/c64ace2))
* feat(ui): add minimize to tray behavior (#45) ([ff15cc0](https://github.com/mistweaverco/timetrack/commit/ff15cc0)), closes [#45](https://github.com/mistweaverco/timetrack/issues/45)
* feat(ui): on item creation, select item (#46) ([a529e46](https://github.com/mistweaverco/timetrack/commit/a529e46)), closes [#46](https://github.com/mistweaverco/timetrack/issues/46)

## <small>5.1.2 (2026-01-23)</small>

* fix(app): icon is rendered correctly now (#42) ([e97d44e](https://github.com/mistweaverco/timetrack/commit/e97d44e)), closes [#42](https://github.com/mistweaverco/timetrack/issues/42)
* fix(ci): remove build from gitignore ([65a438b](https://github.com/mistweaverco/timetrack/commit/65a438b))
* fix(ci): use build dir for icons ([69e015f](https://github.com/mistweaverco/timetrack/commit/69e015f))

## <small>5.1.1 (2026-01-23)</small>

* fix(app): ready not working in default state without custom user config (#41) ([256bbe7](https://github.com/mistweaverco/timetrack/commit/256bbe7)), closes [#41](https://github.com/mistweaverco/timetrack/issues/41)
* fix(web): add fontawesome again ([c3f68dd](https://github.com/mistweaverco/timetrack/commit/c3f68dd))

## 5.1.0 (2026-01-23)

* feat(app): support multiple databases (#40) ([6b03957](https://github.com/mistweaverco/timetrack/commit/6b03957)), closes [#40](https://github.com/mistweaverco/timetrack/issues/40)
* feat(docs): update overview image ([e59986a](https://github.com/mistweaverco/timetrack/commit/e59986a))
* fix(ui): close handler in modals (#39) ([c148b40](https://github.com/mistweaverco/timetrack/commit/c148b40)), closes [#39](https://github.com/mistweaverco/timetrack/issues/39)
* fix(web): update bun.lock ([6fe507f](https://github.com/mistweaverco/timetrack/commit/6fe507f))
* chore(formatter): format everything ([c2d43f1](https://github.com/mistweaverco/timetrack/commit/c2d43f1))

## 5.0.0 (2026-01-22)

* chore(version): bump ([f50802f](https://github.com/mistweaverco/timetrack/commit/f50802f))
* feat(ui): refactor everything, including db (#38) ([4d9c514](https://github.com/mistweaverco/timetrack/commit/4d9c514)), closes [#38](https://github.com/mistweaverco/timetrack/issues/38)

## <small>4.0.1 (2026-01-08)</small>

* fix(ci): windows setup icon ([2feec97](https://github.com/mistweaverco/timetrack/commit/2feec97))
* fix(win): build ([a7ef353](https://github.com/mistweaverco/timetrack/commit/a7ef353))

## 4.0.0 (2026-01-08)

* fix(builder): icon missing ([7f2e74c](https://github.com/mistweaverco/timetrack/commit/7f2e74c))
* fix(ci): fallback to old imagemagick version ([2d17508](https://github.com/mistweaverco/timetrack/commit/2d17508))
* fix(ci): linux bin name ([88af584](https://github.com/mistweaverco/timetrack/commit/88af584))
* fix(ci): remove double build from web ([ac0b61e](https://github.com/mistweaverco/timetrack/commit/ac0b61e))
* fix(ci): web - add empty static dir ([34b45df](https://github.com/mistweaverco/timetrack/commit/34b45df))
* fix(ci): web - sudo install ([99066e7](https://github.com/mistweaverco/timetrack/commit/99066e7))
* fix(docs): restore overview screenshot ([5bfc606](https://github.com/mistweaverco/timetrack/commit/5bfc606))
* fix(eslint): add plugin prettier ([df217e0](https://github.com/mistweaverco/timetrack/commit/df217e0))
* feat(app): complete rewrite (#37) ([74efbed](https://github.com/mistweaverco/timetrack/commit/74efbed)), closes [#37](https://github.com/mistweaverco/timetrack/issues/37)
* feat(website): new website, retire docs (#36) ([3c13df0](https://github.com/mistweaverco/timetrack/commit/3c13df0)), closes [#36](https://github.com/mistweaverco/timetrack/issues/36)

## 3.4.0 (2024-05-19)

* fix!: broken linux- and mac-builds (#28) ([37113ce](https://github.com/mistweaverco/timetrack/commit/37113ce)), closes [#28](https://github.com/mistweaverco/timetrack/issues/28)
* feat: db 💾 migrations 🚚   + pretty logging 💄 (#27) ([88938ad](https://github.com/mistweaverco/timetrack/commit/88938ad)), closes [#27](https://github.com/mistweaverco/timetrack/issues/27)

## 3.3.0 (2024-05-19)

* chore: bump version ([c5b83c5](https://github.com/mistweaverco/timetrack/commit/c5b83c5))
* chore: update node pkgs -> redux, npm, docsify-cli (#25) ([4cd2c94](https://github.com/mistweaverco/timetrack/commit/4cd2c94)), closes [#25](https://github.com/mistweaverco/timetrack/issues/25)
* feat: markdown support in pdf export (#26) ([c09212f](https://github.com/mistweaverco/timetrack/commit/c09212f)), closes [#26](https://github.com/mistweaverco/timetrack/issues/26)

## 3.2.0 (2024-05-18)

* Refactor search + Markdown preview +  Bugfixes (#24) ([f07b6c2](https://github.com/mistweaverco/timetrack/commit/f07b6c2)), closes [#24](https://github.com/mistweaverco/timetrack/issues/24)
* feat: make search pretty ([8a9dcef](https://github.com/mistweaverco/timetrack/commit/8a9dcef))
* chore: fix typo ([ba8e310](https://github.com/mistweaverco/timetrack/commit/ba8e310))
* chore: prettier format ([b9e31e5](https://github.com/mistweaverco/timetrack/commit/b9e31e5))

## 3.1.0 (2024-05-18)

* chore: bump version ([8981cb6](https://github.com/mistweaverco/timetrack/commit/8981cb6))
* feat: all the good things 💋 ([1dbc8bb](https://github.com/mistweaverco/timetrack/commit/1dbc8bb))
* feat: next release incoming 🥳 ([4e6a63f](https://github.com/mistweaverco/timetrack/commit/4e6a63f))
* feat: on and on it goes 🥲 ([c4b1b02](https://github.com/mistweaverco/timetrack/commit/c4b1b02))
* feat: projects rework done 🤔 at least for now ([12b25e8](https://github.com/mistweaverco/timetrack/commit/12b25e8))
* feat: rework ongoing 🚧 ([c21b653](https://github.com/mistweaverco/timetrack/commit/c21b653))
* feat: work hard, play hard 😎 ([e9bd7d8](https://github.com/mistweaverco/timetrack/commit/e9bd7d8))
* feat: working on cleaning up definitions 🗑️ ([6ad5bb7](https://github.com/mistweaverco/timetrack/commit/6ad5bb7))
* feat: working on search and fixing pdf leak 😱 ([d022be7](https://github.com/mistweaverco/timetrack/commit/d022be7))
* fix!: update electron package, fixes wayland crash (#22) ([de5e1b9](https://github.com/mistweaverco/timetrack/commit/de5e1b9)), closes [#22](https://github.com/mistweaverco/timetrack/issues/22)
* fix: icons in binary (#21) ([38eb33f](https://github.com/mistweaverco/timetrack/commit/38eb33f)), closes [#21](https://github.com/mistweaverco/timetrack/issues/21)

## 3.0.0 (2024-05-18)

* Add reusable Modal- and Infobox Components + Search by type now (#13) ([0eb7623](https://github.com/mistweaverco/timetrack/commit/0eb7623)), closes [#13](https://github.com/mistweaverco/timetrack/issues/13)
* feat!: new release 3.0.0 🎉 (#20) ([7f1678e](https://github.com/mistweaverco/timetrack/commit/7f1678e)), closes [#20](https://github.com/mistweaverco/timetrack/issues/20)
* fix!: #18 windows icon is missing (#19) ([4b7f1fa](https://github.com/mistweaverco/timetrack/commit/4b7f1fa)), closes [#18](https://github.com/mistweaverco/timetrack/issues/18) [#19](https://github.com/mistweaverco/timetrack/issues/19)
* feat: add npm run update-interactive script + docs (#15) ([bdc6b8f](https://github.com/mistweaverco/timetrack/commit/bdc6b8f)), closes [#15](https://github.com/mistweaverco/timetrack/issues/15) [#12](https://github.com/mistweaverco/timetrack/issues/12)
* feat: add prettier to eslint (#14) ([2f1d8ab](https://github.com/mistweaverco/timetrack/commit/2f1d8ab)), closes [#14](https://github.com/mistweaverco/timetrack/issues/14)

## 2.2.0 (2024-05-17)

* fix: docsify (#6) ([960eb53](https://github.com/mistweaverco/timetrack/commit/960eb53)), closes [#6](https://github.com/mistweaverco/timetrack/issues/6)
* fix: squirrel-startup missing in prod deps (#8) ([6bb0dd4](https://github.com/mistweaverco/timetrack/commit/6bb0dd4)), closes [#8](https://github.com/mistweaverco/timetrack/issues/8)
* feat: add bare docsify (#4) ([088fc0f](https://github.com/mistweaverco/timetrack/commit/088fc0f)), closes [#4](https://github.com/mistweaverco/timetrack/issues/4)
* feat: add version bump script (#7) ([1c93f77](https://github.com/mistweaverco/timetrack/commit/1c93f77)), closes [#7](https://github.com/mistweaverco/timetrack/issues/7)
* feat!: change CNAME (#5) ([1afba49](https://github.com/mistweaverco/timetrack/commit/1afba49)), closes [#5](https://github.com/mistweaverco/timetrack/issues/5)
* chore: bump node version in CI 📦 ([8186d74](https://github.com/mistweaverco/timetrack/commit/8186d74))

## 2.1.0 (2024-05-16)

* feat: add screenshot ([e4b80e5](https://github.com/mistweaverco/timetrack/commit/e4b80e5))
* feat: don't look 👀 here be dragons 🐉 ([0c49707](https://github.com/mistweaverco/timetrack/commit/0c49707))
* feat: rock on 🤘 ([5c16f1a](https://github.com/mistweaverco/timetrack/commit/5c16f1a))
* feat: welcome to the jungle 🐍 ([2c8b8c1](https://github.com/mistweaverco/timetrack/commit/2c8b8c1))
* feat: wooooooorking like crazy 🦀 ([e363d7a](https://github.com/mistweaverco/timetrack/commit/e363d7a))
* fix: dirty hack reload ([1b2568b](https://github.com/mistweaverco/timetrack/commit/1b2568b))
* fix: lock moment.js to specific version ([51f89bf](https://github.com/mistweaverco/timetrack/commit/51f89bf))
* chore: remove ci fix ([c41d04d](https://github.com/mistweaverco/timetrack/commit/c41d04d))

## <small>2.0.1 (2024-05-15)</small>

* fix(ci): Try to fix forge with tmpdir ([12a93de](https://github.com/mistweaverco/timetrack/commit/12a93de))

## 2.0.0 (2024-05-15)

* feat: add more typescript support ([d8f1a5a](https://github.com/mistweaverco/timetrack/commit/d8f1a5a))
* feat: change release.yaml ([f8f2e80](https://github.com/mistweaverco/timetrack/commit/f8f2e80))
* feat: clean package.json ([fc7f070](https://github.com/mistweaverco/timetrack/commit/fc7f070))
* feat: Gumbo Jumbo 🐢 ([b565824](https://github.com/mistweaverco/timetrack/commit/b565824))
* feat: Redux is working 🍸 ([a4cbab7](https://github.com/mistweaverco/timetrack/commit/a4cbab7))
* feat: Road to React 🚧 ([77b0e4a](https://github.com/mistweaverco/timetrack/commit/77b0e4a))
* feat: Typesafe countup 🥳 ([6e7f24a](https://github.com/mistweaverco/timetrack/commit/6e7f24a))
* feat: Typesafe database 🥳 ([4b30701](https://github.com/mistweaverco/timetrack/commit/4b30701))
* feat: Typescript hype train 🚆 ([1268ef6](https://github.com/mistweaverco/timetrack/commit/1268ef6))
* feat: Work hard, play hard 🥳 ([ae50064](https://github.com/mistweaverco/timetrack/commit/ae50064))
* chore!: fix windows build ([3963b89](https://github.com/mistweaverco/timetrack/commit/3963b89))
* feat!: add vite and typescript support ([ef3186d](https://github.com/mistweaverco/timetrack/commit/ef3186d))

## <small>1.0.3 (2024-05-11)</small>

* ⚡️ Improve CI ([374791b](https://github.com/mistweaverco/timetrack/commit/374791b))
* 🌃 It's dark out here.. ([b45651e](https://github.com/mistweaverco/timetrack/commit/b45651e))
* 🚀 Initial commit ([49c094d](https://github.com/mistweaverco/timetrack/commit/49c094d))
