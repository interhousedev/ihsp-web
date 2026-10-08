import type { SearchResults } from "@ihsp/api"
import type { CommandPaletteResult } from "@ihsp/ui"

export type SearchLabels = {
  subjects: string
  lessons: string
  homework: string
  files: string
  flashcardSets: string
}

export type SearchFormat = {
  /** `2026-10-07` → "7 Oct". */
  date: (value: string) => string
}

/** Maps `GET /v1/me/search` to command palette rows grouped by section (WEB-4, UF-WEB-14). */
export function toPaletteResults(
  results: SearchResults,
  labels: SearchLabels,
  format: SearchFormat,
): CommandPaletteResult[] {
  return [
    ...results.subjects.map((subject) => ({
      id: `subject-${subject.id}`,
      title: subject.name,
      section: labels.subjects,
      url: `/subjects/view/?id=${encodeURIComponent(subject.id)}`,
      icon: "subjects" as const,
    })),
    ...results.lessons.map((lesson) => ({
      id: `lesson-${lesson.id}`,
      title: lesson.topic ?? lesson.subject.name,
      subtitle: `${lesson.subject.name} · ${format.date(lesson.date)}`,
      section: labels.lessons,
      url: `/lessons/view/?id=${encodeURIComponent(lesson.id)}`,
      icon: "timetable" as const,
    })),
    ...results.homework.map((item) => ({
      id: `homework-${item.lesson_id}`,
      title: item.text,
      subtitle: item.subject.name,
      section: labels.homework,
      url: `/lessons/view/?id=${encodeURIComponent(item.lesson_id)}`,
      icon: "homework" as const,
    })),
    ...results.files.map((file) => ({
      id: `file-${file.id}`,
      title: file.name,
      section: labels.files,
      url: "/files/",
      icon: "files" as const,
    })),
    ...results.flashcard_sets.map((set) => ({
      id: `set-${set.id}`,
      title: set.title,
      section: labels.flashcardSets,
      url: `/flashcards/set/?id=${encodeURIComponent(set.id)}`,
      icon: "flashcards" as const,
    })),
  ]
}
