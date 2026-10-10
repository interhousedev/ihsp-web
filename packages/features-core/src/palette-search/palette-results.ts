import type { SearchResults } from "@ihsp/api"
import type { CommandPaletteResult } from "@ihsp/ui"

export type PaletteLabels = {
  subjects: string
  lessons: string
  homework: string
  files: string
  flashcardSets: string
  notebooks: string
  marks: string
  libraryItems: string
}

export type PaletteFormat = {
  /** `2026-10-07` → "7 Oct". */
  date: (value: string) => string
}

/**
 * Deep links of one app. A group whose route is missing (`null`/absent) is left out: the staff app has no files page, and
 * the library lives on its own host (`library` gives the item URL, or nothing when the host is not configured).
 */
export type PaletteRoutes = {
  subject?: ((id: string) => string) | null
  lesson?: ((id: string) => string) | null
  files?: string | null
  flashcardSet?: ((id: string) => string) | null
  notebook?: ((id: string) => string) | null
  /** Marks open the subject they belong to. */
  marks?: ((subjectId: string) => string) | null
  libraryItem?: ((id: string) => string) | null
}

const q = encodeURIComponent

/** The routes of the student app (`apps/sp`), the library on its own host given as `libraryBase` (may be empty). */
export function studentRoutes(libraryBase?: string): PaletteRoutes {
  const base = libraryBase?.replace(/\/+$/, "")
  return {
    subject: (id) => `/subjects/view/?id=${q(id)}`,
    lesson: (id) => `/lessons/view/?id=${q(id)}`,
    files: "/files/",
    flashcardSet: (id) => `/flashcards/set/?id=${q(id)}`,
    notebook: (id) => `/notebooks/view/?id=${q(id)}`,
    marks: (id) => `/subjects/view/?id=${q(id)}`,
    libraryItem: base ? (id) => `${base}/item/?id=${q(id)}` : null,
  }
}

/** The routes of the staff app (`apps/staff`): lessons, notebooks and the library; no files page. */
export function staffRoutes(libraryBase?: string): PaletteRoutes {
  const base = libraryBase?.replace(/\/+$/, "")
  return {
    lesson: (id) => `/lessons/view/?id=${q(id)}`,
    notebook: (id) => `/notebooks/view/?id=${q(id)}`,
    libraryItem: base ? (id) => `${base}/item/?id=${q(id)}` : null,
  }
}

/**
 * Maps `GET /v1/me/search` to command palette rows, one section per kind with its icon and a deep link (WEB-4,
 * UF-WEB-14). Sections follow the order: subjects, lessons, homework, marks, notebooks, flash card sets, files, library.
 */
export function toPaletteResults(
  results: SearchResults,
  labels: PaletteLabels,
  format: PaletteFormat,
  routes: PaletteRoutes,
): CommandPaletteResult[] {
  const rows: CommandPaletteResult[] = []
  const { subject, lesson, files, flashcardSet, notebook, marks, libraryItem } = routes
  if (subject)
    for (const item of results.subjects)
      rows.push({
        id: `subject-${item.id}`,
        title: item.name,
        section: labels.subjects,
        url: subject(item.id),
        icon: "subjects",
      })
  if (lesson) {
    for (const item of results.lessons)
      rows.push({
        id: `lesson-${item.id}`,
        title: item.topic ?? item.subject.name,
        subtitle: item.topic ? `${item.subject.name} · ${format.date(item.date)}` : format.date(item.date),
        section: labels.lessons,
        url: lesson(item.id),
        icon: "timetable",
      })
    for (const item of results.homework)
      rows.push({
        id: `homework-${item.lesson_id}`,
        title: item.text,
        subtitle: item.subject.name,
        section: labels.homework,
        url: lesson(item.lesson_id),
        icon: "homework",
      })
  }
  if (marks)
    for (const [index, item] of results.marks.entries())
      rows.push({
        id: `mark-${item.subject.id}-${item.date}-${index}`,
        title: `${item.subject.name}: ${item.value}`,
        subtitle: format.date(item.date),
        section: labels.marks,
        url: marks(item.subject.id),
        icon: "grades",
      })
  if (notebook)
    for (const item of results.notebooks)
      rows.push({
        id: `notebook-${item.id}`,
        title: item.title,
        ...(item.matched_sources[0] ? { subtitle: item.matched_sources[0] } : {}),
        section: labels.notebooks,
        url: notebook(item.id),
        icon: "notebooks",
      })
  if (flashcardSet)
    for (const item of results.flashcard_sets)
      rows.push({
        id: `set-${item.id}`,
        title: item.title,
        section: labels.flashcardSets,
        url: flashcardSet(item.id),
        icon: "flashcards",
      })
  if (files)
    for (const item of results.files)
      rows.push({ id: `file-${item.id}`, title: item.name, section: labels.files, url: files, icon: "files" })
  if (libraryItem)
    for (const item of results.library_items)
      rows.push({
        id: `library-${item.id}`,
        title: item.title,
        subtitle: item.author_label,
        section: labels.libraryItems,
        url: libraryItem(item.id),
        icon: "library",
      })
  return rows
}
