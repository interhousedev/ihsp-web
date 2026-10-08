/**
 * Where the official Mini App script lives. The apps do not need it (they use `@tma.js/sdk`, which reads the launch
 * parameters itself); it is only loaded inside Telegram, as the Mini Apps documentation recommends.
 */
export const TELEGRAM_SDK_URL = "https://telegram.org/js/telegram-web-app.js?64"

/**
 * Inline script for the `<head>` of `sp`, `staff` and `id`. A plain `<script src="https://telegram.org/...">` blocks
 * the whole page until telegram.org answers, which took seconds (sometimes tens of seconds) for every visitor. This
 * loader adds the script, asynchronously, only when Telegram launched the page: launch parameters in the URL hash, kept
 * in `sessionStorage` for later pages, or the native `TelegramWebviewProxy`. It never throws.
 */
export const TELEGRAM_SDK_LOADER = `(function(){try{var w=window,i=/tgWebApp/.test(w.location.hash)||!!w.TelegramWebviewProxy;if(!i){try{i=!!(w.sessionStorage.getItem("tapps/launchParams")||w.sessionStorage.getItem("__telegram__initParams"))}catch(e){}}if(!i)return;var s=document.createElement("script");s.src="${TELEGRAM_SDK_URL}";s.async=true;s.setAttribute("data-telegram-sdk","");document.head.appendChild(s)}catch(e){}})();`
