/**
 * The LMS skin: "classic" (the Stepik-like screens) or "playful" (learning path, 3D buttons, celebrations). The account
 * keeps the choice (`preferences.lms_skin`, `null` until the user picks); this device mirrors it in localStorage so the
 * head script sets `<html data-skin>` before the first paint.
 */

export type Skin = "classic" | "playful"

export const SKIN_STORAGE_KEY = "ihsp.lms-skin"
export const SOUND_STORAGE_KEY = "ihsp.lms-sound"
/** "Decide later": when the chooser was postponed and how many times. */
export const SKIN_LATER_KEY = "ihsp.lms-skin-later"

export const SKINS: readonly Skin[] = ["classic", "playful"]

export function isSkin(value: unknown): value is Skin {
  return value === "classic" || value === "playful"
}

/** Inline `<head>` script: applies the stored skin before first paint (CSP hashes are computed at build). */
export const SKIN_INIT_SCRIPT = `try{var s=localStorage.getItem('${SKIN_STORAGE_KEY}');if(s==='playful')document.documentElement.setAttribute('data-skin','playful')}catch(e){}`

export function readStoredSkin(): Skin | null {
  try {
    const value = window.localStorage.getItem(SKIN_STORAGE_KEY)
    return isSkin(value) ? value : null
  } catch {
    return null
  }
}

export function applySkin(skin: Skin): void {
  const root = document.documentElement
  if (skin === "playful") root.setAttribute("data-skin", "playful")
  else root.removeAttribute("data-skin")
  try {
    window.localStorage.setItem(SKIN_STORAGE_KEY, skin)
  } catch {
    // Private mode: the account still keeps the choice.
  }
}

const LATER_DAYS = 7
const LATER_MAX = 2

type Later = { at: number; count: number }

function readLater(): Later | null {
  const raw = window.localStorage.getItem(SKIN_LATER_KEY)
  if (!raw) return null
  const parsed: unknown = JSON.parse(raw)
  if (!parsed || typeof parsed !== "object" || !("at" in parsed) || !("count" in parsed)) return null
  const { at, count } = parsed
  return typeof at === "number" && typeof count === "number" ? { at, count } : null
}

/** Whether "Decide later" still hides the chooser: 7 days each time; after two postponements it is never asked again. */
export function chooserPostponed(now: number = Date.now()): boolean {
  try {
    const later = readLater()
    if (!later) return false
    if (later.count >= LATER_MAX) return true
    return now - later.at < LATER_DAYS * 86_400_000
  } catch {
    return false
  }
}

export function postponeChooser(now: number = Date.now()): void {
  try {
    const count = readLater()?.count ?? 0
    window.localStorage.setItem(SKIN_LATER_KEY, JSON.stringify({ at: now, count: count + 1 }))
  } catch {
    // Nothing to remember on this device.
  }
}
