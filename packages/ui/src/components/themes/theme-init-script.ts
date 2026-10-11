import { DEFAULT_LOCALE, LOCALE_STORAGE_KEY, LOCALES } from "@ihsp/i18n"

/**
 * Inline script for `<head>` (put it in each app's root layout): applies the saved color palette and the cached
 * light/dark mode before first paint so neither flashes. The mode is stored by next-themes under `theme`
 * (`ThemePreferenceSync` keeps it equal to the account's `preferences.theme`); with nothing stored it is light.
 * It also sets `<html lang>` from the stored locale (`LOCALE_STORAGE_KEY` of `@ihsp/i18n`; `DEFAULT_LOCALE` when
 * nothing valid is stored) so the static HTML, first paint and screen readers get the right language before
 * `I18nProvider` runs. It is a plain string constant, importable from server components via `@ihsp/ui/theme-init`.
 */
export const THEME_INIT_SCRIPT =
  `try{var d=document.documentElement;var t=localStorage.getItem('ihsp.color-theme');if(t)d.setAttribute('data-theme',t);` +
  `var m=localStorage.getItem('theme')||'light';var k=m==='dark'||(m==='system'&&window.matchMedia('(prefers-color-scheme: dark)').matches);` +
  `d.classList.remove('light','dark');d.classList.add(k?'dark':'light');d.style.colorScheme=k?'dark':'light';` +
  `var l=localStorage.getItem('${LOCALE_STORAGE_KEY}');d.lang=${JSON.stringify(LOCALES)}.indexOf(l)>=0?l:'${DEFAULT_LOCALE}'}catch(e){}`
