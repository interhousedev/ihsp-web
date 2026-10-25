/** `sessionStorage` keys used by flows that cross pages (the mini app registration round trip). */
export const TELEGRAM_INIT_DATA_KEY = "ihsp:id:tg-init-data"
export const TELEGRAM_NEW_LOGIN_KEY = "ihsp:id:tg-new-login"

export function readSession(key: string): string | null {
  try {
    return window.sessionStorage.getItem(key)
  } catch {
    return null
  }
}

export function writeSession(key: string, value: string): void {
  try {
    window.sessionStorage.setItem(key, value)
  } catch {
    // Storage can be blocked (private mode, Telegram web views); the flow then simply does not remember the value.
  }
}

export function removeSession(key: string): void {
  try {
    window.sessionStorage.removeItem(key)
  } catch {
    // See writeSession.
  }
}
