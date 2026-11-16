"use client"

import { useT } from "@ihsp/i18n"
import { Pill, Skeleton, StateView } from "@ihsp/ui"
import type { UseQueryResult } from "@tanstack/react-query"
import type { ReactNode } from "react"
import { useStudentSection } from "../api"

function Section<T>({ query, children }: { query: UseQueryResult<T>; children: (data: T) => ReactNode }) {
  if (query.isPending) return <Skeleton className="h-32 w-full" />
  if (query.isError) return <StateView state="error" onRetry={() => void query.refetch()} />
  return <>{children(query.data)}</>
}

function text(value: unknown): string {
  if (value === null || value === undefined) return "—"
  if (typeof value === "string" || typeof value === "number" || typeof value === "boolean") return String(value)
  return JSON.stringify(value)
}

function Facts({ rows }: { rows: [string, unknown][] }) {
  return (
    <dl className="grid grid-cols-1 gap-x-6 gap-y-2 sm:grid-cols-2">
      {rows.map(([key, value]) => (
        <div key={key} className="flex flex-col">
          <dt className="text-muted-foreground text-xs">{key}</dt>
          <dd className="text-sm break-words">{text(value)}</dd>
        </div>
      ))}
    </dl>
  )
}

export function ProfileTab({ studentId }: { studentId: string }) {
  const t = useT("staff")
  return (
    <Section query={useStudentSection(studentId, "profile")}>
      {(profile) => (
        <div className="flex flex-col gap-4">
          <div className="flex flex-wrap gap-2">
            <Pill tone="primary">{profile.stage}</Pill>
            <Pill tone={profile.setup_completed ? "success" : "warning"}>
              {profile.setup_completed ? t("student.setupDone") : t("student.setupOpen")}
            </Pill>
          </div>
          <Facts rows={Object.entries(profile.answers)} />
          {profile.missing_required.length > 0 ? (
            <p className="text-warning text-sm">
              {t("student.missing", { list: profile.missing_required.join(", ") })}
            </p>
          ) : null}
        </div>
      )}
    </Section>
  )
}

export function WordsTab({ studentId }: { studentId: string }) {
  const t = useT("staff")
  return (
    <Section query={useStudentSection(studentId, "words")}>
      {(words) =>
        words.words.length === 0 ? (
          <StateView state="empty" title={t("student.wordsEmpty")} />
        ) : (
          <div className="flex flex-wrap gap-2">
            {words.words.map((word, index) => (
              <Pill key={`${text(word)}-${index}`}>{text(word)}</Pill>
            ))}
          </div>
        )
      }
    </Section>
  )
}

export function AlignmentTab({ studentId }: { studentId: string }) {
  const t = useT("staff")
  return (
    <Section query={useStudentSection(studentId, "alignment")}>
      {(alignment) =>
        alignment.overall === null && Object.keys(alignment.grades).length === 0 ? (
          <StateView state="empty" title={t("student.alignmentEmpty")} />
        ) : (
          <div className="flex flex-col gap-3">
            <div className="flex flex-wrap gap-2">
              <Pill tone="primary">{text(alignment.overall)}</Pill>
              {alignment.stale ? <Pill tone="warning">{t("student.stale")}</Pill> : null}
            </div>
            <Facts rows={Object.entries(alignment.grades)} />
          </div>
        )
      }
    </Section>
  )
}

export function CoursesTab({ studentId }: { studentId: string }) {
  const t = useT("staff")
  return (
    <Section query={useStudentSection(studentId, "courses")}>
      {({ items }) =>
        items.length === 0 ? (
          <StateView state="empty" title={t("student.coursesEmpty")} />
        ) : (
          <ul className="flex flex-col gap-2">
            {items.map((course, index) => (
              <li
                key={course.id ?? index}
                className="flex flex-wrap items-center justify-between gap-2 rounded-lg border p-3"
              >
                <span className="text-sm font-medium">{course.title}</span>
                <span className="text-muted-foreground text-xs">
                  {[course.provider, course.level, course.year, course.grade].filter((v) => v != null).join(" · ")}
                </span>
              </li>
            ))}
          </ul>
        )
      }
    </Section>
  )
}

export function ListTab({ studentId }: { studentId: string }) {
  const t = useT("staff")
  return (
    <Section query={useStudentSection(studentId, "list")}>
      {(list) => {
        const entries = list.items ?? []
        return entries.length === 0 ? (
          <StateView state="empty" title={t("student.listEmpty")} />
        ) : (
          <ul className="flex flex-col gap-2">
            {entries.map((entry, index) => (
              <li key={text(entry.id ?? index)} className="rounded-lg border p-3">
                <Facts rows={Object.entries(entry).filter(([, v]) => typeof v !== "object" || v === null)} />
              </li>
            ))}
          </ul>
        )
      }}
    </Section>
  )
}
