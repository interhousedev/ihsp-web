"use client"

import type { SubjectDetail } from "@ihsp/api"
import { TeacherAvatar, TemporaryGpa } from "@ihsp/features-core"
import { useErrorMessage, useT } from "@ihsp/i18n"
import { Button, Icons, MarkBadge, Stat } from "@ihsp/ui"
import Link from "next/link"
import { useOpenSubjectNotebook } from "../hooks/use-subject-hub"
import { LinkButton } from "../../shared/components/link-button"
import { fullName } from "../../shared/utils/people"
import { teacherHref } from "../../teachers/utils/teacher-display"

function percent(value: number | null): string {
  return value === null ? "–" : `${Math.round(value * 100)}%`
}

/** Overview (WEB-8): teachers, semester mark with its averages, EMIS rating and absence rate. */
export function SubjectOverviewTab({ detail }: { detail: SubjectDetail }) {
  const t = useT("subjects.overview")
  const errorMessage = useErrorMessage()
  const open = useOpenSubjectNotebook(detail.subject.id)
  const planner = `/grades/plan/?subject=${encodeURIComponent(detail.subject.id)}&semester=${detail.semester}`
  return (
    <div className="flex flex-col gap-4">
      <section className="flex flex-wrap items-center justify-between gap-3 rounded-lg border p-3">
        <h2 className="text-sm font-semibold">{t("notebook")}</h2>
        <div className="flex flex-wrap gap-2">
          <LinkButton href={planner}>
            <Icons.grades aria-hidden />
            {t("planner")}
          </LinkButton>
          <Button className="min-h-11 md:min-h-8" disabled={open.isPending} onClick={() => open.mutate({})}>
            <Icons.journal aria-hidden />
            {t("openNotebook")}
          </Button>
        </div>
      </section>
      {open.isError ? (
        <p role="alert" className="text-destructive text-sm">
          {errorMessage(open.error)}
        </p>
      ) : null}
      <section aria-labelledby="subject-teachers">
        <h2 id="subject-teachers" className="mb-1 text-sm font-semibold">
          {t("teachers")}
        </h2>
        {detail.teachers.length > 0 ? (
          <ul className="flex flex-wrap gap-2">
            {detail.teachers.map((teacher) => (
              <li key={teacher.id}>
                <Link
                  href={teacherHref(teacher.id)}
                  className="hover:bg-muted inline-flex min-h-11 items-center gap-2 rounded-full border py-1 pr-3 pl-1 text-sm md:min-h-8"
                >
                  <TeacherAvatar name={fullName(teacher)} photoUrl={teacher.photo_url} size="sm" decorative />
                  <span>{fullName(teacher)}</span>
                </Link>
              </li>
            ))}
          </ul>
        ) : (
          <p className="text-sm">–</p>
        )}
      </section>
      <div className="grid grid-cols-2 gap-3 md:grid-cols-4">
        <Stat
          label={t("semesterMark")}
          value={
            <span className="inline-flex items-start">
              <MarkBadge mark={detail.semester_mark} size="lg" />
              <TemporaryGpa value={detail.gpa_with_temporary} />
            </span>
          }
        />
        <Stat label={t("emisRating")} value={detail.emis_rating ?? "–"} />
        <Stat label={t("absenceRate")} value={percent(detail.absence_rate)} />
      </div>
      <section aria-labelledby="subject-averages">
        <h2 id="subject-averages" className="mb-2 text-sm font-semibold">
          {t("averages")}
        </h2>
        <dl className="grid grid-cols-3 gap-3 text-sm">
          {(["lesson", "midterm", "final"] as const).map((type) => (
            <div key={type} className="rounded-lg border p-3">
              <dt className="text-muted-foreground text-xs">{t(`type.${type}`)}</dt>
              <dd className="mt-1">
                <MarkBadge mark={detail.averages[type]} />
              </dd>
            </div>
          ))}
        </dl>
      </section>
    </div>
  )
}
