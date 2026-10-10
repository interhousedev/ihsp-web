"use client"

import { useT } from "@ihsp/i18n"
import { Badge, Input, MarkBadge, PageContainer, StateView } from "@ihsp/ui"
import { IconSearch } from "@ihsp/ui"
import Link from "next/link"
import { parseAsString, useQueryState } from "nuqs"
import { useTeacherStudents } from "./hooks/use-teacher-students"
import { nameOf, searchStudents, type StudentSummary } from "./utils"

export function studentHref(id: string): string {
  return `/students/view/?id=${encodeURIComponent(id)}`
}

/** Subjects of a student, shown under the name: "Physics · 2TN2". */
function subjectsLine(student: StudentSummary): string {
  return student.entries.map((entry) => entry.option.label).join(" · ")
}

/**
 * One search box over every student of the teacher's subjects and groups (name, any word order, prefixes). A result
 * opens the profile. `?q=` keeps the search in the address.
 */
export function StudentSearch() {
  const t = useT("students")
  const [query, setQuery] = useQueryState("q", parseAsString.withDefault(""))
  const { students, isPending, error } = useTeacherStudents()
  const found = searchStudents(students, query)

  return (
    <PageContainer title={t("title")}>
      <div className="relative max-w-md">
        <IconSearch
          aria-hidden
          className="text-muted-foreground pointer-events-none absolute start-3 top-1/2 size-4 -translate-y-1/2"
        />
        <Input
          type="search"
          autoFocus
          value={query}
          aria-label={t("search")}
          placeholder={t("search")}
          className="min-h-11 ps-9 md:min-h-9"
          onChange={(event) => void setQuery(event.target.value || null)}
        />
      </div>

      {isPending ? <StateView state="loading" rows={5} /> : null}
      {!isPending && error && students.length === 0 ? <StateView state="error" error={error} /> : null}
      {!isPending && !error && students.length === 0 ? <StateView state="empty" emptyText={t("noStudents")} /> : null}
      {students.length > 0 && found.length === 0 ? (
        <StateView state="empty" emptyText={t("noResults", { query })} />
      ) : null}
      {found.length > 0 ? (
        <>
          <p className="text-muted-foreground text-sm" aria-live="polite">
            {t("count", { count: found.length })}
          </p>
          <ul className="flex flex-col gap-1.5" data-testid="student-results">
            {found.map((student) => (
              <li key={student.userId}>
                <Link
                  href={studentHref(student.userId)}
                  className="hover:bg-accent focus-visible:ring-ring flex min-h-11 items-center justify-between gap-3 rounded-lg border p-2 outline-none focus-visible:ring-2"
                >
                  <span className="flex min-w-0 flex-col">
                    <span className="truncate text-sm font-medium">{nameOf(student)}</span>
                    <span className="text-muted-foreground truncate text-xs">{subjectsLine(student)}</span>
                  </span>
                  <span className="flex shrink-0 items-center gap-1.5">
                    {student.entries
                      .filter((entry) => entry.student.semester_mark !== null)
                      .slice(0, 3)
                      .map((entry) => (
                        <MarkBadge
                          key={entry.option.subject.id + entry.option.audience_key}
                          mark={entry.student.semester_mark}
                          size="sm"
                        />
                      ))}
                    {student.entries.some((entry) => entry.student.absences > 0) ? (
                      <Badge variant="outline">
                        {t("absences", {
                          count: student.entries.reduce((sum, entry) => sum + entry.student.absences, 0),
                        })}
                      </Badge>
                    ) : null}
                  </span>
                </Link>
              </li>
            ))}
          </ul>
        </>
      ) : null}
    </PageContainer>
  )
}
