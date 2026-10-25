import { parsePinRecord, type PinRecord } from "./pin"

/** One record per user on this device, so a second account on the same phone is not locked by the first one's PIN. */
export const PIN_STORAGE_PREFIX = "ihsp.pwa.pin."

/** Fired on `window` after the PIN of the page's user was set, changed or removed (the `storage` event covers other tabs). */
export const PIN_CHANGED_EVENT = "ihsp:pin-changed"

export function pinStorageKey(userId: string): string {
  return `${PIN_STORAGE_PREFIX}${userId}`
}

export function readPinRecord(userId: string | null): PinRecord | null {
  if (!userId) return null
  try {
    return parsePinRecord(window.localStorage.getItem(pinStorageKey(userId)))
  } catch {
    return null
  }
}

/** Returns false when the storage refuses (blocked, full): the lock would not survive a restart, so it is not turned on. */
export function writePinRecord(userId: string, record: PinRecord): boolean {
  try {
    window.localStorage.setItem(pinStorageKey(userId), JSON.stringify(record))
  } catch {
    return false
  }
  window.dispatchEvent(new Event(PIN_CHANGED_EVENT))
  return true
}

export function clearPinRecord(userId: string | null): void {
  if (!userId) return
  try {
    window.localStorage.removeItem(pinStorageKey(userId))
  } catch {
    // Nothing is stored then.
  }
  window.dispatchEvent(new Event(PIN_CHANGED_EVENT))
}
