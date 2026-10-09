import type { Annotation } from "@ihsp/api"

// Locators of the reader (docs/reference/study-library.md § 3.8): `{ page }` for PDF and images, `{ cfi, progress }`
// for EPUB. They travel in annotations, in the progress calls and in the `?page=` / `?loc=` parameters of `/read/`.

export type Locator = Annotation["locator"]
export type PageLocator = { page: number }
export type CfiLocator = { cfi: string; progress: number }

export function isPageLocator(locator: Locator): locator is PageLocator {
  return "page" in locator
}

export function isCfiLocator(locator: Locator): locator is CfiLocator {
  return "cfi" in locator
}

/** A positive whole number from a query parameter, else `null`. */
export function parsePageParam(value: string | null | undefined): number | null {
  if (value === null || value === undefined || !/^\d{1,6}$/.test(value.trim())) return null
  const page = Number(value)
  return page >= 1 ? page : null
}

const CFI_PATTERN = /^epubcfi\(.+\)$/
const CFI_WITH_PROGRESS = /^(epubcfi\(.+\))@(\d(?:\.\d+)?)$/

/** Fractions are kept to four decimals: enough for a progress bar, short enough for a URL. */
export function clampFraction(value: number): number {
  if (!Number.isFinite(value)) return 0
  return Math.round(Math.min(Math.max(value, 0), 1) * 10_000) / 10_000
}

/**
 * The value of `?loc=`: the CFI, followed by `@progress` when the fraction of the book is known
 * (`epubcfi(/6/8!/4/2/10)@0.35`). A CFI never has a character after its closing bracket, so the suffix is free.
 */
export function encodeCfiLocation(locator: CfiLocator): string {
  return `${locator.cfi}@${clampFraction(locator.progress)}`
}

/** The reverse of `encodeCfiLocation`; a bare CFI gets progress 0. Anything that is not a CFI gives `null`. */
export function decodeCfiLocation(value: string | null | undefined): CfiLocator | null {
  if (!value) return null
  const text = value.trim()
  const withProgress = CFI_WITH_PROGRESS.exec(text)
  if (withProgress) return { cfi: withProgress[1]!, progress: clampFraction(Number(withProgress[2])) }
  return CFI_PATTERN.test(text) ? { cfi: text, progress: 0 } : null
}

/** What the reader is asked to open: `?page=` for pages, `?loc=` for a CFI; a valid `loc` wins over `page`. */
export function parseLocator(input: { page?: string | null; loc?: string | null }): Locator | null {
  const cfi = decodeCfiLocation(input.loc)
  if (cfi) return cfi
  const page = parsePageParam(input.page)
  return page === null ? null : { page }
}

/** The query parameters of `readHref` for a locator. */
export function locatorToHrefParams(locator: Locator | null | undefined): { page?: number; loc?: string } {
  if (!locator) return {}
  return isPageLocator(locator) ? { page: locator.page } : { loc: encodeCfiLocation(locator) }
}

/** The percent (0 to 100, two decimals) the progress call wants. */
export function percentOf(fraction: number): number {
  return Math.round(clampFraction(fraction) * 10_000) / 100
}

/** Reading progress of a PDF position as a fraction of the document. */
export function pageFraction(page: number, pages: number): number {
  if (pages <= 0) return 0
  return clampFraction(Math.min(Math.max(page, 1), pages) / pages)
}

/** The page a fraction of the document falls on (1-based), for resuming from a bare `progress_percent`. */
export function fractionPage(fraction: number, pages: number): number {
  if (pages <= 0) return 1
  return Math.min(Math.max(Math.ceil(clampFraction(fraction) * pages), 1), pages)
}

// - - - The position remembered on this device - - -

const POSITION_KEY = "ihsp.library.position"

type StoredPositions = Record<string, { locator: Locator; at: string; fraction?: number }>

function readAll(): StoredPositions {
  try {
    const raw = window.localStorage.getItem(POSITION_KEY)
    const parsed: unknown = raw ? JSON.parse(raw) : {}
    return parsed && typeof parsed === "object" ? (parsed as StoredPositions) : {}
  } catch {
    return {}
  }
}

const MAX_STORED_POSITIONS = 60

/**
 * The server keeps the position for other devices (`PUT /me/library/progress`), but the API has no call that returns
 * it, so the reader also keeps the last place per file on this device and resumes from there.
 */
export function readStoredPosition(itemId: string, fileId: string): Locator | null {
  const entry = readAll()[`${itemId}:${fileId}`]
  const locator = entry?.locator
  if (!locator) return null
  if (isPageLocator(locator)) return Number.isInteger(locator.page) && locator.page >= 1 ? locator : null
  return typeof locator.cfi === "string" && CFI_PATTERN.test(locator.cfi) ? locator : null
}

/** The fraction of the item read at the stored place, for formats whose locator cannot hold it (Markdown, text). */
export function readStoredFraction(itemId: string, fileId: string): number | null {
  const fraction = readAll()[`${itemId}:${fileId}`]?.fraction
  return typeof fraction === "number" && Number.isFinite(fraction) ? clampFraction(fraction) : null
}

export function writeStoredPosition(
  itemId: string,
  fileId: string,
  locator: Locator,
  fraction?: number,
  now: Date = new Date(),
): void {
  try {
    const all = readAll()
    all[`${itemId}:${fileId}`] = {
      locator,
      at: now.toISOString(),
      ...(fraction === undefined ? {} : { fraction: clampFraction(fraction) }),
    }
    const keep = Object.entries(all)
      .toSorted((a, b) => b[1].at.localeCompare(a[1].at))
      .slice(0, MAX_STORED_POSITIONS)
    window.localStorage.setItem(POSITION_KEY, JSON.stringify(Object.fromEntries(keep)))
  } catch {
    // Storage can be blocked (private window, full): the position is only a convenience.
  }
}
