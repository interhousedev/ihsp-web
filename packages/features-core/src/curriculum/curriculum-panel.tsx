"use client"

import type { CurriculumHoursItem, CurriculumSemester, CurriculumSubject, CurriculumView } from "@ihsp/api"
import { useFormatters, useT, type Locale } from "@ihsp/i18n"
import {
  Badge,
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@ihsp/ui"
import type { ReactNode } from "react"
import { languageName, localizedText } from "./curriculum-utils"
import { SubjectTypeBadge } from "./subject-type-badge"

export type CurriculumPanelProps = {
  /** `null`: the group has no stored curriculum yet, the empty message is shown. */
  curriculum: CurriculumView | null
  /** Adds a table of the subjects (type, hours, separated) under every semester: the administrator's view. */
  showSubjects?: boolean
  /** Replaces the default empty message. */
  emptyText?: string
}

const NO_VALUE = "–"

function formatNumber(value: number | null, locale: Locale): string {
  return value === null ? NO_VALUE : value.toLocaleString(locale)
}

function Section({ title, children }: { title: string; children: ReactNode }) {
  return (
    <section className="flex flex-col gap-2">
      <h3 className="text-sm font-medium">{title}</h3>
      {children}
    </section>
  )
}

function SemesterHeading({ semester }: { semester: CurriculumSemester }) {
  const t = useT("curriculum")
  const f = useFormatters()
  const from = semester.starts_on ? f.date(semester.starts_on) : null
  const to = semester.ends_on ? f.date(semester.ends_on) : null
  return (
    <>
      <span className="flex items-center gap-2 font-medium">
        {t("semester", { number: semester.number })}
        {semester.is_current ? <Badge variant="secondary">{t("current")}</Badge> : null}
      </span>
      {from || to ? (
        <span className="text-muted-foreground text-xs">{t("period", { from: from ?? "…", to: to ?? "…" })}</span>
      ) : null}
    </>
  )
}

function SubjectsTable({ subjects }: { subjects: CurriculumSubject[] }) {
  const t = useT("curriculum")
  const f = useFormatters()
  if (subjects.length === 0) return <p className="text-muted-foreground text-sm">{t("noSubjects")}</p>
  return (
    <Table>
      <TableHeader>
        <TableRow>
          <TableHead>{t("table.subject")}</TableHead>
          <TableHead>{t("table.type")}</TableHead>
          <TableHead className="text-right">{t("table.hours")}</TableHead>
          <TableHead className="text-right">{t("table.classHours")}</TableHead>
          <TableHead className="text-right">{t("table.independentHours")}</TableHead>
          <TableHead>{t("table.separated")}</TableHead>
        </TableRow>
      </TableHeader>
      <TableBody>
        {subjects.map((subject, index) => (
          <TableRow key={`${index}-${subject.emis_subject_id}`}>
            <TableCell className="font-medium whitespace-normal">
              {localizedText(subject.name, f.locale) || NO_VALUE}
            </TableCell>
            <TableCell>
              <SubjectTypeBadge typeId={subject.subject_type_id} />
            </TableCell>
            <TableCell className="text-right">{formatNumber(subject.study_hours, f.locale)}</TableCell>
            <TableCell className="text-right">{formatNumber(subject.class_hours, f.locale)}</TableCell>
            <TableCell className="text-right">{formatNumber(subject.independent_hours, f.locale)}</TableCell>
            <TableCell>{subject.is_separated ? t("table.yes") : t("table.no")}</TableCell>
          </TableRow>
        ))}
      </TableBody>
    </Table>
  )
}

function HoursList({ items }: { items: CurriculumHoursItem[] }) {
  const t = useT("curriculum")
  const f = useFormatters()
  return (
    <ul className="divide-y rounded-lg border text-sm">
      {items.map((item, index) => (
        <li key={`${index}-${item.name.en}`} className="flex items-start justify-between gap-3 px-3 py-2">
          <span className="min-w-0 break-words">{localizedText(item.name, f.locale) || NO_VALUE}</span>
          {item.study_hours === null ? null : (
            <span className="text-muted-foreground shrink-0">{t("hours", { count: item.study_hours })}</span>
          )}
        </li>
      ))}
    </ul>
  )
}

/**
 * The curriculum of a group from EMIS: speciality, direction, form and language of study, rating scale, the semesters
 * with their dates (the current one marked), the exams and the vocational subjects. The student sees it compact; the
 * administrator also gets the subjects of every semester (`showSubjects`).
 */
export function CurriculumPanel({ curriculum, showSubjects = false, emptyText }: CurriculumPanelProps) {
  const t = useT("curriculum")
  const f = useFormatters()
  if (!curriculum) {
    return (
      <Card>
        <CardHeader>
          <CardTitle role="heading" aria-level={2}>
            {t("title")}
          </CardTitle>
        </CardHeader>
        <CardContent>
          <p role="status" className="text-muted-foreground text-sm">
            {emptyText ?? t("empty")}
          </p>
        </CardContent>
      </Card>
    )
  }

  const direction = curriculum.direction
  const directionText = direction
    ? [direction.name, direction.code ? `(${direction.code})` : null].filter(Boolean).join(" ")
    : ""
  const min = curriculum.rating_scale?.min ?? null
  const max = curriculum.rating_scale?.max ?? null
  const scaleText =
    min !== null && max !== null
      ? t("scale.range", { min, max })
      : min !== null
        ? t("scale.from", { min })
        : max !== null
          ? t("scale.to", { max })
          : ""
  const fields = [
    { label: t("speciality"), value: localizedText(curriculum.speciality, f.locale) },
    { label: t("direction"), value: directionText },
    { label: t("eduForm"), value: curriculum.edu_form ?? "" },
    { label: t("language"), value: curriculum.language_code ? languageName(curriculum.language_code, f.locale) : "" },
    { label: t("ratingScale"), value: scaleText },
  ].filter((field) => field.value !== "")
  const semesters = curriculum.semesters.toSorted((a, b) => a.number - b.number)
  const description = [
    curriculum.name,
    t("updated", { date: f.date(curriculum.fetched_at) }),
    showSubjects ? `EMIS ${curriculum.emis_curriculum_id}` : null,
  ]
    .filter(Boolean)
    .join(" · ")

  return (
    <Card>
      <CardHeader>
        <CardTitle role="heading" aria-level={2}>
          {t("title")}
        </CardTitle>
        <CardDescription>{description}</CardDescription>
      </CardHeader>
      <CardContent className="flex flex-col gap-4">
        {fields.length > 0 ? (
          <dl className="grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-3">
            {fields.map((field) => (
              <div key={field.label} className="min-w-0">
                <dt className="text-muted-foreground text-xs">{field.label}</dt>
                <dd className="text-sm font-medium break-words">{field.value}</dd>
              </div>
            ))}
          </dl>
        ) : null}
        {semesters.length > 0 ? (
          <Section title={t("semesters")}>
            <ul className="divide-y rounded-lg border text-sm">
              {semesters.map((semester) => (
                <li key={semester.number} data-current={semester.is_current || undefined}>
                  {showSubjects ? (
                    <details open={semester.is_current}>
                      <summary className="flex cursor-pointer flex-wrap items-center justify-between gap-x-3 gap-y-1 px-3 py-2">
                        <SemesterHeading semester={semester} />
                      </summary>
                      <div className="px-3 pb-3">
                        <SubjectsTable subjects={semester.subjects} />
                      </div>
                    </details>
                  ) : (
                    <div className="flex flex-wrap items-center justify-between gap-x-3 gap-y-1 px-3 py-2">
                      <SemesterHeading semester={semester} />
                    </div>
                  )}
                </li>
              ))}
            </ul>
          </Section>
        ) : null}
        {curriculum.exams.length > 0 ? (
          <Section title={t("exams")}>
            <HoursList items={curriculum.exams} />
          </Section>
        ) : null}
        {curriculum.vocational_subjects.length > 0 ? (
          <Section title={t("vocational")}>
            <HoursList items={curriculum.vocational_subjects} />
          </Section>
        ) : null}
      </CardContent>
    </Card>
  )
}
