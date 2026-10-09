/** Colours of the browser bar around the installed app (light and dark `--background` of the theme). */
export const PWA_THEME_COLOR_LIGHT = "#ffffff"
export const PWA_THEME_COLOR_DARK = "#0a0a0a"

export const MANIFEST_PATH = "/manifest.webmanifest"
export const APPLE_TOUCH_ICON_PATH = "/icons/apple-touch-icon.png"

/** Event the head script dispatches when it has caught `beforeinstallprompt` (the page may not be hydrated yet). */
export const INSTALL_PROMPT_EVENT = "ihsp:installprompt"

/** Where the head script keeps the caught `beforeinstallprompt` event. */
export const INSTALL_PROMPT_GLOBAL = "__ihspInstallPrompt"

/**
 * Inline script for `<head>`, right after `/env.js`. The sp build is shared by the portal and the installable app, so
 * the static HTML cannot carry the manifest: only when `window.__ENV__.APP_MODE` is `pwa` does it add the manifest link,
 * the iOS home screen tags and the theme colours, and it catches `beforeinstallprompt` (Chrome fires it early, often
 * before React is hydrated). In the portal it does nothing. It is a plain string, importable from the server layout.
 */
export const PWA_HEAD_SCRIPT = `try{var e=window.__ENV__;if(e&&e.APP_MODE==='pwa'){var h=document.head;var a=function(t,o){var n=document.createElement(t);for(var k in o)n.setAttribute(k,o[k]);h.appendChild(n)};a('link',{rel:'manifest',href:'${MANIFEST_PATH}'});a('link',{rel:'apple-touch-icon',href:'${APPLE_TOUCH_ICON_PATH}'});a('meta',{name:'theme-color',content:'${PWA_THEME_COLOR_LIGHT}',media:'(prefers-color-scheme: light)'});a('meta',{name:'theme-color',content:'${PWA_THEME_COLOR_DARK}',media:'(prefers-color-scheme: dark)'});a('meta',{name:'apple-mobile-web-app-capable',content:'yes'});a('meta',{name:'mobile-web-app-capable',content:'yes'});a('meta',{name:'apple-mobile-web-app-title',content:'IHSP'});a('meta',{name:'apple-mobile-web-app-status-bar-style',content:'default'});window.addEventListener('beforeinstallprompt',function(v){v.preventDefault();window.${INSTALL_PROMPT_GLOBAL}=v;window.dispatchEvent(new Event('${INSTALL_PROMPT_EVENT}'))})}}catch(x){}`
