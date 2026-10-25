---
name: i18n
description: Use when adding or changing any user-facing text, message keys, terminology, dates or search in iht-web - uz/ru/en parity, school terms (ПК/ИК, Урок) and Uzbek apostrophes.
---

# Internationalization

- **Three locales, always together:** uz, ru, en. Shared namespaces in `packages/i18n/messages/<locale>.json`, app text in `apps/<app>/messages/<locale>/*.json`. The parity test fails if key sets differ.
- `next-intl` on the client without locale routing; use `useT`. `<html lang>` follows the locale. No hard-coded user-facing text.
- Keys are camel-namespaced: `assistant.composer.web`.

## Terms
- "Промежуточный контроль (ПК)" and "Итоговый контроль (ИК)". Never "Рубежный контроль".
- Russian: "Урок", never "Занятие". LMS glossary: Курс, Модуль, Урок, Шаг.
- The student app is "my.iht" ("SP" is only a code name); the teacher app is "IHT Учителям".
- Uzbek uses ʻ (oʻ, gʻ) and ʼ (tutuqbelgi) in admin and LMS texts; search folds every apostrophe form and Uzbek Cyrillic to Latin.

## Copy
- No page subtitles, no dialog descriptions repeating the title, no obvious hints. Keep hints that prevent mistakes.
- Dates and times in Asia/Tashkent; the school week is Monday to Friday.
- Problem+json error `type`s map to translated keys; the UI never shows raw backend messages.
