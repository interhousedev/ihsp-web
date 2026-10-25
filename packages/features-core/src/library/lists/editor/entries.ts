import { arrayMove } from "@dnd-kit/sortable"
import type {
  Importance,
  ItemCard,
  ReadingListDetail,
  ReadingListEntry,
  ReadingListInput,
  ReadingListItemInput,
  ReadingListScope,
  ReadingListStatus,
} from "@ihsp/api"

/** The most entries a reading list holds (`422 library/list-too-long` above this). */
export const MAX_ENTRIES = 100
export const NOTE_MAX = 500
export const TITLE_MAX = 200
export const DESCRIPTION_MAX = 2000

export const IMPORTANCE_LEVELS: readonly Importance[] = ["essential", "recommended", "further"]

/** One entry as the editor holds it: numbers and dates are kept as the text the user typed. */
export type EditorEntry = {
  key: string
  /** The catalogue item, or `null` for a plain link. */
  item: ItemCard | null
  url: string
  /** The title of a plain link (an item carries its own). */
  title: string
  importance: Importance
  pageFrom: string
  pageTo: string
  weekLabel: string
  dueOn: string
  note: string
  /** Kept from a loaded entry so saving does not drop it. */
  topicId: string | null
}

export type EntryProblem = "urlInvalid" | "titleRequired" | "pagesInvalid" | "noteTooLong"

let counter = 0
const nextKey = () => `entry-${Date.now().toString(36)}-${(counter += 1)}`

const text = (value: string | null | undefined) => value ?? ""

export function entryFromServer(entry: ReadingListEntry): EditorEntry {
  return {
    key: nextKey(),
    item: entry.item,
    url: text(entry.url),
    title: text(entry.title),
    importance: entry.importance,
    pageFrom: entry.page_from === null ? "" : String(entry.page_from),
    pageTo: entry.page_to === null ? "" : String(entry.page_to),
    weekLabel: text(entry.week_label),
    dueOn: text(entry.due_on),
    note: text(entry.note),
    topicId: entry.topic_id,
  }
}

const blank = { pageFrom: "", pageTo: "", weekLabel: "", dueOn: "", note: "", topicId: null } as const

/** A catalogue item as a new entry (Recommended until the teacher says otherwise). */
export function itemEntry(item: ItemCard, importance: Importance = "recommended"): EditorEntry {
  return { key: nextKey(), item, url: "", title: "", importance, ...blank }
}

export function linkEntry(title: string, url: string, importance: Importance = "recommended"): EditorEntry {
  return { key: nextKey(), item: null, url: url.trim(), title: title.trim(), importance, ...blank }
}

/** The id a catalogue entry is stored by, or `null` for a link. */
export const entryItemId = (entry: EditorEntry): string | null => entry.item?.id ?? null

export function hasItem(entries: readonly EditorEntry[], itemId: string): boolean {
  return entries.some((entry) => entryItemId(entry) === itemId)
}

export function updateEntry(entries: readonly EditorEntry[], key: string, patch: Partial<EditorEntry>): EditorEntry[] {
  return entries.map((entry) => (entry.key === key ? { ...entry, ...patch } : entry))
}

export function removeEntry(entries: readonly EditorEntry[], key: string): EditorEntry[] {
  return entries.filter((entry) => entry.key !== key)
}

/**
 * Moves the entry at visible position `from` to visible position `to`. Entries hidden from the screen (UniLibrary
 * records while UniLibrary is off) stay in the list and are never lost, because saving replaces the whole list.
 */
export function moveVisible(
  entries: readonly EditorEntry[],
  isVisible: (entry: EditorEntry) => boolean,
  from: number,
  to: number,
): EditorEntry[] {
  const positions = entries.flatMap((entry, index) => (isVisible(entry) ? [index] : []))
  const source = positions[from]
  const target = positions[to]
  if (source === undefined || target === undefined || source === target) return [...entries]
  return arrayMove([...entries], source, target)
}

const URL_PROTOCOLS = ["http:", "https:"]

export function isHttpUrl(value: string): boolean {
  try {
    return URL_PROTOCOLS.includes(new URL(value.trim()).protocol)
  } catch {
    return false
  }
}

function pageNumber(value: string): number | null {
  const trimmed = value.trim()
  if (trimmed === "") return null
  const number = Number(trimmed)
  return Number.isInteger(number) && number >= 1 ? number : Number.NaN
}

/** What is wrong with one entry. */
export function entryProblems(entry: EditorEntry): EntryProblem[] {
  const problems: EntryProblem[] = []
  if (entry.item === null) {
    if (!isHttpUrl(entry.url)) problems.push("urlInvalid")
    if (entry.title.trim() === "") problems.push("titleRequired")
  }
  const from = pageNumber(entry.pageFrom)
  const to = pageNumber(entry.pageTo)
  if (Number.isNaN(from) || Number.isNaN(to) || (from !== null && to !== null && from > to)) {
    problems.push("pagesInvalid")
  }
  if (entry.note.length > NOTE_MAX) problems.push("noteTooLong")
  return problems
}

const orNull = (value: string): string | null => (value.trim() === "" ? null : value.trim())
const pageOrNull = (value: string): number | null => {
  const number = pageNumber(value)
  return number === null || Number.isNaN(number) ? null : number
}

/** The body of `PUT /library/reading-lists/{id}/items`. */
export function toItemInputs(entries: readonly EditorEntry[]): ReadingListItemInput[] {
  return entries.map((entry) => {
    const itemId = entryItemId(entry)
    return {
      ...(itemId ? { item_id: itemId } : { url: entry.url.trim(), title: entry.title.trim() }),
      importance: entry.importance,
      page_from: pageOrNull(entry.pageFrom),
      page_to: pageOrNull(entry.pageTo),
      week_label: orNull(entry.weekLabel),
      due_on: orNull(entry.dueOn),
      topic_id: entry.topicId,
      note: orNull(entry.note),
    }
  })
}

// - - - The list itself (title, audience, status) - - -

export type ListSettings = {
  title: string
  description: string
  scope: ReadingListScope
  subjectId: string
  groupIds: string[]
  /** 1 or 2, or `null` for every year. */
  year: number | null
  /** 1 or 2, or `null` for the whole year. */
  termHalf: 1 | 2 | null
  status: ReadingListStatus
}

export const emptySettings = (): ListSettings => ({
  title: "",
  description: "",
  scope: "subject",
  subjectId: "",
  groupIds: [],
  year: null,
  termHalf: null,
  status: "draft",
})

export function settingsFromServer(list: ReadingListDetail): ListSettings {
  return {
    title: list.title,
    description: text(list.description),
    scope: list.scope,
    subjectId: list.subject?.id ?? "",
    groupIds: [...list.group_ids],
    year: list.year_of_study,
    termHalf: list.term_half,
    status: list.status,
  }
}

export type SettingsProblem = "titleRequired" | "subjectRequired" | "groupsRequired"

/** `groupsAvailable` is false when the caller has no way to list groups; then "groups" cannot be required. */
export function settingsProblems(settings: ListSettings, groupsAvailable = true): SettingsProblem[] {
  const problems: SettingsProblem[] = []
  if (settings.title.trim() === "") problems.push("titleRequired")
  if (settings.scope === "subject" && settings.subjectId === "") problems.push("subjectRequired")
  if (settings.scope === "groups" && groupsAvailable && settings.groupIds.length === 0) problems.push("groupsRequired")
  return problems
}

/** The body of `POST` and `PATCH /library/reading-lists`. */
export function toListInput(settings: ListSettings): ReadingListInput {
  return {
    title: settings.title.trim(),
    description: orNull(settings.description),
    scope: settings.scope,
    subject_id: settings.subjectId === "" ? null : settings.subjectId,
    group_ids: settings.scope === "groups" ? settings.groupIds : [],
    year_of_study: settings.year,
    term_half: settings.termHalf,
    status: settings.status,
  }
}
