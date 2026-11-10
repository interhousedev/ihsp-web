# Changelog

All notable changes to this project are documented here. The format follows [Keep a Changelog](https://keepachangelog.com/en/1.1.0/) and the project uses [Semantic Versioning](https://semver.org/). Release tags are `vX.Y.Z`; images are published as `X.Y.Z`, `X.Y` and `sha-<commit>`.

## [Unreleased]

## [1.2.1] - 2026-11-11

### Changed

- Landing: full rework with a compacting pill header, a scroll-driven hero, device mockups of the real product UI (dashboard, timetable, marks, AI notebooks, journal, library, LMS, Telegram bot, excuses), reveal-on-scroll and a sign-in call to action in uz, ru and en. The old screenshots were removed.
- Admin: the Vault unseal page sends the key share only, without a confirmation code.
- admin.iht and iht.id: new favicon, app icons and sidebar logo.
- iht.id: sign-in and registration use a split layout with a campus photo and the lyceum motto on the right (hidden below `lg`); the "I don't remember my EMIS ID" and "never logged into EMIS" actions are now secondary and link style.

## [1.2.0] - 2026-11-10

### Added

- Admin: upload login cues from a CSV, TSV or TXT file; a Vault unseal page; entrance devices (keys shown once, revocation, 7-day call log).
- Share: visualizations of guest bot answers (`g-` slugs); opened as a Telegram Mini App, the view calls `ready()` and expands.
- iht.id: personal API tokens with expiry, revocation and last use; the account pages also appear in my.iht under the profile.
- Face photos: students upload their own in the profile unless a curator or administrator set one; curators manage their students' photos.
- Excuses: students request excuses with documents and a message thread; curators approve, reject, revoke and create exclusions; excused lessons are locked in the journal.
- Onboarding tour, a floating assistant and an app-map search in my.iht and the staff app.
- my.iht dashboard: an even grid with drag to reorder in edit mode, new library and recent notebook widgets, a full-width size, and the same loading, empty and error states on every card; one column on phones.
- Admin: a banner when Vault is sealed, linking to the unseal page; administrators see students' face photos.

### Changed

- Timetable, journal and attendance use the backend's single `excused` flag.
- READMEs: unified banners and current screenshots.

### Fixed

- Landing: brand placeholders (`{orgAlias}`, `{appMy}`) were shown as message keys.
- iht.id registration: the long "never logged into EMIS" button no longer clips its text.

### Known issues

- Dashboard: homework and flash card widgets show empty-state text instead of 0; the library widget shows the reading shelf without due dates.

## [1.1.1] - 2026-11-06

### Added

- First-time EMIS registration, a required Telegram step and a form to change the EMIS password.

### Changed

- The name picker is now a prominent button above the EMIS form, with clearer wording; the welcome screen has icons.

## [1.1.0] - 2026-11-06

- Sharing: share a notebook or file by sign-in link or with named people, chat read-only in a private thread on your own limits, copy a shared notebook, attach one as live base materials.

### Added

- Certificate files open in the system browser from the Telegram mini app.
- The Test workflow also runs on pushes to `main`.
- One share menu for files that says which link is public and which requires sign-in.
- Connectors page: accept or decline new MCP permissions without Telegram, and see or stop your media links.
- Flash cards: merge sets, per-card statistics, restart a study session and set settings.
- Staff certificate statistics by a type's starred field, with an average when that field is a number.
- Lesson time blocks per weekday, Saturday and Sunday included, in the timetable editor.
- MCP: Gemini setup with OAuth in the connector wizard, the connector activity page, and a page that opens media links.
- Refreshed student pages: today, timetable, grades, homework, subjects, lessons, files, notebooks and my group.
- `release` project skill: local CI, changelog, tagging, and image builds.
- Bottom bar in the ID app, and a platforms section in the "More" sheet.
- Telegram theme and safe areas in the LMS and library mini apps.
- A way back to the home page on the open source packages page.

### Changed

- Staff timetable: when a period has different times on different days, each lesson shows its own time.
- Files look and behave the same across apps: one row, type icons, size format, preview and download. In the Telegram mini app, downloads open in the system browser.
- Navigation uses one icon and one name per destination across apps, and "More" lights up on pages without a tab.
- Telegram's Back button replaces the shell's history buttons in the mini app, and links to other apps leave through Telegram.

### Known issues

- Telegram behaviour has not been checked on a real device, and Gemini sign-in has not been tried against the real service.
- MCP media links work as bearer links for 5 hours.

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
