/**
 * The phone bottom bar's pages. The user picks and orders them in Settings; the choice is a list of destination ids
 * (`DESTINATION_IDS`), saved per user (account preferences, with this device's storage as the fallback).
 */
export const DESTINATION_IDS = [
  "today",
  "timetable",
  "subjects",
  "grades",
  "attendance",
  "homework",
  "exams",
  "assistant",
  "notebooks",
  "flashcards",
  "files",
  "links",
  "notifications",
  "settings",
] as const

export type DestinationId = (typeof DESTINATION_IDS)[number]

/** Paths of the destinations (the same as the sidebar's). */
export const DESTINATION_URLS: Record<DestinationId, string> = {
  today: "/",
  timetable: "/timetable/",
  subjects: "/subjects/",
  grades: "/grades/",
  attendance: "/attendance/",
  homework: "/homework/",
  exams: "/exams/",
  assistant: "/assistant/",
  notebooks: "/notebooks/",
  flashcards: "/flashcards/",
  files: "/files/",
  links: "/links/",
  notifications: "/notifications/",
  settings: "/settings/",
}

/** Slots the user can fill; the last of the five bar slots is always "More". */
export const MAX_BOTTOM_TABS = 4

export const DEFAULT_BOTTOM_BAR: readonly DestinationId[] = ["today", "timetable", "grades", "homework"]

/** Legacy account entry that carried the choice inside `onboarding_dismissed`; read once, then moved to `bottom_nav`. */
export const BOTTOM_BAR_PREFIX = "bottom-nav:"

export function isDestinationId(value: string): value is DestinationId {
  return (DESTINATION_IDS as readonly string[]).includes(value)
}

/** Known ids in order without duplicates, cut to the slots; an empty result falls back to the defaults. */
export function normalizeBottomBar(ids: readonly string[]): DestinationId[] {
  const seen = new Set<DestinationId>()
  for (const id of ids) if (isDestinationId(id)) seen.add(id)
  const list = [...seen].slice(0, MAX_BOTTOM_TABS)
  return list.length > 0 ? list : [...DEFAULT_BOTTOM_BAR]
}

/** The legacy `["bottom-nav:today,grades"]` entry as `["today","grades"]`; `null` when there is none. */
export function readLegacyBottomBar(entries: readonly string[] | undefined): DestinationId[] | null {
  const entry = entries?.find((value) => value.startsWith(BOTTOM_BAR_PREFIX))
  if (entry === undefined) return null
  return normalizeBottomBar(entry.slice(BOTTOM_BAR_PREFIX.length).split(","))
}

/** The preference list without the legacy bottom bar entry. */
export function dropLegacyBottomBar(entries: readonly string[] | undefined): string[] {
  return (entries ?? []).filter((value) => !value.startsWith(BOTTOM_BAR_PREFIX))
}

export function bottomBarStorageKey(userId: string): string {
  return `ihsp:sp:bottom-bar:${userId}`
}

export function readStoredBottomBar(userId: string): DestinationId[] | null {
  try {
    const raw = window.localStorage.getItem(bottomBarStorageKey(userId))
    if (!raw) return null
    const parsed: unknown = JSON.parse(raw)
    return Array.isArray(parsed) ? normalizeBottomBar(parsed.filter((v): v is string => typeof v === "string")) : null
  } catch {
    return null
  }
}

export function storeBottomBar(userId: string, ids: readonly DestinationId[]): void {
  try {
    window.localStorage.setItem(bottomBarStorageKey(userId), JSON.stringify(ids))
  } catch {
    // Storage blocked: the account copy still holds the choice.
  }
}
