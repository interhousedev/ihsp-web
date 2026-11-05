# Changelog

All notable changes to this project are documented here. The format follows [Keep a Changelog](https://keepachangelog.com/en/1.1.0/) and the project uses [Semantic Versioning](https://semver.org/). Release tags are `vX.Y.Z`; images are published as `X.Y.Z`, `X.Y` and `sha-<commit>`.

## [Unreleased]

### Added

- `release` project skill: local CI, changelog, tagging, and image builds.

## [1.0.18] - 2026-11-05

### Added

- Tests that the stored answer replaces streamed text after a normal finish, an approval wait and an error.

## [1.0.17] - 2026-11-04

### Added

- Shell: logo toggle, floating controls and platform menu.
- Assistant: reworked panel, projects and "Connect my AI".
- Flash cards: add questions with AI inside a set.
- Student: grade tabs, homework autosave, calendar and files.
- Staff: lesson pop-ups.
- Admin: student photos with camera and group export.
- LMS: path URLs and a unified course page.
- Licence section and packages page, and one brand config with generated assets.

### Security

- Patched and pinned the base images, updated fast-uri and happy-dom, and fixed a ReDoS in the OpenUI text check.

### Fixed

- nginx moved to 1.30.1, and the vendored corpus is kept out of oxfmt.
