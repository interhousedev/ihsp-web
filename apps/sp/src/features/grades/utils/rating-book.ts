import type { CurriculumView, RecordBook, StudentProfile } from "@ihsp/api"

export type BookLine =
  | { kind: "band"; semester: number }
  | { kind: "row"; number: number; subject: string; mark: string }

/** Lines that fit under the header of the first page, and on each following page. */
export const FIRST_PAGE_LINES = 14
export const NEXT_PAGE_LINES = 28

const DASH = "-"

/** Semester bands with numbered subject rows, in semester order; a missing mark prints as "-". */
export function bookLines(book: RecordBook): BookLine[] {
  return [...book.semesters]
    .sort((a, b) => a.semester - b.semester)
    .flatMap((semester) => [
      { kind: "band", semester: semester.semester } as const,
      ...semester.subjects.map(
        (item, index) =>
          ({
            kind: "row",
            number: index + 1,
            subject: item.subject.name,
            mark: item.semester_mark === null ? DASH : String(item.semester_mark),
          }) as const,
      ),
    ])
}

/** Splits lines into A4 pages; a band never ends a page alone. */
export function paginate(lines: BookLine[]): BookLine[][] {
  const pages: BookLine[][] = [[]]
  let capacity = FIRST_PAGE_LINES
  for (const [index, line] of lines.entries()) {
    const page = pages[pages.length - 1] as BookLine[]
    const bandNeedsTwo = line.kind === "band" && lines[index + 1] !== undefined
    if (page.length + (bandNeedsTwo ? 2 : 1) > capacity) {
      pages.push([])
      capacity = NEXT_PAGE_LINES
    }
    ;(pages[pages.length - 1] as BookLine[]).push(line)
  }
  return pages
}

export type BookFields = {
  student: string
  group: string
  speciality: string
  educationType: string
  form: string
  course: string
  language: string
  academicYear: string
}

type Locale = "uz" | "ru" | "en"

function localized(name: { uz: string; ru: string; en: string } | null | undefined, locale: Locale): string {
  return name?.[locale] || name?.ru || name?.en || name?.uz || DASH
}

function academicYear(curriculum: CurriculumView | null | undefined): string {
  const current = curriculum?.semesters.find((semester) => semester.is_current)
  const from = current?.starts_on?.slice(0, 4)
  const to = current?.ends_on?.slice(0, 4)
  if (!from || !to) return DASH
  return from === to ? `${Number(from) - 1}-${to}` : `${from}-${to}`
}

/** The header fields; anything the sources do not give is "-". */
export function bookFields(
  profile: StudentProfile | undefined,
  curriculum: CurriculumView | null | undefined,
  locale: Locale,
  middleName?: string | null,
): BookFields {
  const name = profile ? [profile.last_name, profile.first_name, middleName].filter(Boolean).join(" ") : ""
  return {
    student: name || DASH,
    group: profile?.group?.name || DASH,
    speciality: localized(curriculum?.speciality, locale),
    educationType: DASH,
    form: curriculum?.edu_form || DASH,
    course: profile?.current_semester ? String(Math.ceil(profile.current_semester / 2)) : DASH,
    language: curriculum?.language_code || DASH,
    academicYear: academicYear(curriculum),
  }
}
