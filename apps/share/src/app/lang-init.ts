/**
 * Inline script for `<head>`, next to `THEME_INIT_SCRIPT`: sets `<html lang>` before first paint from the stored locale
 * (`ihsp.locale`, the key of `@ihsp/i18n`), then the browser language, then `uz`. So the static HTML, the offline
 * fallback and screen readers get the right language at once; `I18nProvider` keeps it in step afterwards.
 * A plain string constant, so the server layout can import it. The same script lives in every app
 * (`@ihsp/i18n` has no server-safe entry point yet).
 */
export const LANG_INIT_SCRIPT = `try{var s=['uz','ru','en'];var l=localStorage.getItem('ihsp.locale');if(s.indexOf(l)<0){l=null;var n=navigator.languages||[navigator.language];for(var i=0;i<n.length&&!l;i++){var b=String(n[i]||'').toLowerCase().split('-')[0];if(s.indexOf(b)>=0)l=b}}document.documentElement.lang=l||'uz'}catch(e){}`
