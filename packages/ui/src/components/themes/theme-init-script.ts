/**
 * Inline script for `<head>` (put it in each app's root layout): applies the saved color palette and the cached
 * light/dark mode before first paint so neither flashes. The mode is stored by next-themes under `theme`
 * (`ThemePreferenceSync` keeps it equal to the account's `preferences.theme`); with nothing stored it is light.
 * It is a plain string constant, importable from server components via `@ihsp/ui/theme-init`.
 */
export const THEME_INIT_SCRIPT = `try{var d=document.documentElement;var t=localStorage.getItem('ihsp.color-theme');if(t)d.setAttribute('data-theme',t);var m=localStorage.getItem('theme')||'light';var k=m==='dark'||(m==='system'&&window.matchMedia('(prefers-color-scheme: dark)').matches);d.classList.remove('light','dark');d.classList.add(k?'dark':'light');d.style.colorScheme=k?'dark':'light'}catch(e){}`
