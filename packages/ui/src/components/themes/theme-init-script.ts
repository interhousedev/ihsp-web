/**
 * Inline script for `<head>` (put it in each app's root layout): applies the saved color palette before first paint
 * so it does not flash. It is a plain string constant, importable from server components via `@ihsp/ui/theme-init`.
 */
export const THEME_INIT_SCRIPT = `try{var t=localStorage.getItem('ihsp.color-theme');if(t)document.documentElement.setAttribute('data-theme',t)}catch(e){}`
