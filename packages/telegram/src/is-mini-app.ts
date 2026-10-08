import { isTMA, retrieveRawInitData } from "@tma.js/sdk-react"

/** True when the page runs inside Telegram (launch parameters are present). False while prerendering. */
export function isMiniApp(): boolean {
  if (typeof window === "undefined") return false
  try {
    return isTMA()
  } catch {
    return false
  }
}

/** The raw, signed `initData` string for the backend (`POST /v1/oauth/telegram`); `undefined` outside Telegram. */
export function getInitDataRaw(): string | undefined {
  if (!isMiniApp()) return undefined
  try {
    return retrieveRawInitData() || undefined
  } catch {
    return undefined
  }
}
