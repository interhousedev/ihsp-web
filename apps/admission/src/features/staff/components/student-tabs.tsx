"use client"

import { useT } from "@ihsp/i18n"
import { Pill, Skeleton, StateView } from "@ihsp/ui"
import type { UseQueryResult } from "@tanstack/react-query"
import type { ReactNode } from "react"
import { useOptionLabel } from "../../chooser/components/option-label"
import { useWizardConfig } from "../../profile/api"
import { useProfileText } from "../../profile/lib/use-profile-text"
import { useStudentSection } from "../api"
import type { DeniedSection } from "../../shell/components/access-denied"
import { QueryError } from "../../shell/components/query-error"

function Section<T>({
  query,
  section,
  children,
}: {
  query: UseQueryResult<T>
  section: DeniedSection
  children: (data: T) => ReactNode
}) {
  if (query.isPending) return <Skeleton className="h-32 w-full" />
  if (query.isError) return <QueryError error={query.error} onRetry={() => void query.refetch()} section={section} />
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

function useAnswerText() {
  const t = useT("profile")
  const text = useProfileText()
  const display = (questionId: string, value: unknown): string => {
    if (value === null || value === undefined || value === "") return t("notAnswered")
    if (typeof value === "boolean") return t(value ? "yes" : "no")
    if (Array.isArray(value)) {
      return value
        .map((item) =>
          item !== null && typeof item === "object"
            ? Object.values(item as Record<string, unknown>)
                .filter((v) => v !== null && v !== "")
                .map((v) => text.option(questionId, String(v)))
                .join(" · ")
            : text.option(questionId, String(item)),
        )
        .join(", ")
    }
    return typeof value === "string" ? text.option(questionId, value) : String(value)
  }
  return { text, display }
}

export function ProfileTab({ studentId }: { studentId: string }) {
  const t = useT("staff")
  const config = useWizardConfig()
  const { text, display } = useAnswerText()
  return (
    <Section query={useStudentSection(studentId, "profile")} section="profile">
      {(profile) => {
        const questions = config.data?.questions ?? []
        const known = new Set(questions.map((question) => question.id))
        const sections = [...new Set(questions.map((question) => question.section))]
        const unknown = Object.entries(profile.answers).filter(([id]) => !known.has(id))
        return (
          <div className="flex flex-col gap-6">
            <div className="flex flex-wrap gap-2">
              <Pill tone="primary">{t(`stages.${profile.stage}`)}</Pill>
              <Pill tone={profile.setup_completed ? "success" : "warning"}>
                {profile.setup_completed ? t("student.setupDone") : t("student.setupOpen")}
              </Pill>
            </div>
            {sections.map((section) => {
              const rows = questions.filter(
                (question) => question.section === section && profile.answers[question.id] !== undefined,
              )
              if (rows.length === 0) return null
              return (
                <section key={section} className="flex flex-col gap-2">
                  <h2 className="text-sm font-semibold">{text.section(section)}</h2>
                  <Facts rows={rows.map((q) => [text.label(q.id), display(q.id, profile.answers[q.id])])} />
                </section>
              )
            })}
            {unknown.length > 0 ? (
              <Facts rows={unknown.map(([id, value]) => [text.label(id), display(id, value)])} />
            ) : null}
            {profile.missing_required.length > 0 ? (
              <p className="text-warning text-sm">
                {t("student.missing", { list: profile.missing_required.map((id) => text.label(id)).join(", ") })}
              </p>
            ) : null}
          </div>
        )
      }}
    </Section>
  )
}

export function WordsTab({ studentId }: { studentId: string }) {
  const t = useT("staff")
  return (
    <Section query={useStudentSection(studentId, "words")} section="words">
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
  const align = useT("alignment")
  const level = (value: unknown) => {
    const key = `level.${String(value)}`
    return align.has(key) ? align(key) : text(value)
  }
  return (
    <Section query={useStudentSection(studentId, "alignment")} section="alignment">
      {(alignment) =>
        alignment.overall === null && Object.keys(alignment.grades).length === 0 ? (
          <StateView state="empty" title={t("student.alignmentEmpty")} />
        ) : (
          <div className="flex flex-col gap-3">
            <div className="flex flex-wrap items-center gap-2">
              {alignment.overall ? (
                <Pill tone="primary">{t("student.gradeLabel", { grade: alignment.overall })}</Pill>
              ) : null}
              {alignment.stale ? <Pill tone="warning">{t("student.stale")}</Pill> : null}
            </div>
            <p className="text-muted-foreground text-xs">{t("student.gradeHint")}</p>
            {alignment.stale ? <p className="text-muted-foreground text-xs">{t("student.staleHint")}</p> : null}
            <h2 className="text-sm font-semibold">{t("student.wordsLabel")}</h2>
            <Facts rows={Object.entries(alignment.grades).map(([word, value]) => [word, level(value)])} />
          </div>
        )
      }
    </Section>
  )
}

export function CoursesTab({ studentId }: { studentId: string }) {
  const t = useT("staff")
  return (
    <Section query={useStudentSection(studentId, "courses")} section="courses">
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
  const round = useOptionLabel("round")
  const bucket = useOptionLabel("bucket")
  const affordability = useOptionLabel("affordability")
  return (
    <Section query={useStudentSection(studentId, "list")} section="list">
      {(entries) =>
        entries.length === 0 ? (
          <StateView state="empty" title={t("student.listEmpty")} />
        ) : (
          <ul className="flex flex-col gap-2">
            {entries.map((entry) => (
              <li key={entry.id} className="flex flex-col gap-2 rounded-lg border p-3">
                <div className="flex flex-wrap items-center justify-between gap-2">
                  <span className="text-sm font-medium">{entry.institution.name}</span>
                  <span className="text-muted-foreground text-xs">
                    {[entry.institution.city, entry.institution.country].filter(Boolean).join(", ")}
                  </span>
                </div>
                <div className="flex flex-wrap gap-2">
                  <Pill>{round(entry.round)}</Pill>
                  {entry.bucket ? <Pill tone="primary">{bucket(entry.bucket)}</Pill> : null}
                  <Pill>{affordability(entry.affordability_status)}</Pill>
                </div>
                {entry.notes ? <p className="text-muted-foreground text-sm break-words">{entry.notes}</p> : null}
              </li>
            ))}
          </ul>
        )
      }
    </Section>
  )
}
