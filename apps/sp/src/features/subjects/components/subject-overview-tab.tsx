"use client"

import type { SubjectDetail } from "@ihsp/api"
import { useT } from "@ihsp/i18n"
import { MarkBadge, Stat } from "@ihsp/ui"
import { fullName } from "../../shared/utils/people"

function percent(value: number | null): string {
  return value === null ? "–" : `${Math.round(value * 100)}%`
}

/** Overview (WEB-8): teachers, semester mark with its averages, EMIS rating and absence rate. */
export function SubjectOverviewTab({ detail }: { detail: SubjectDetail }) {
  const t = useT("subjects.overview")
  return (
    <div className="flex flex-col gap-4">
      <section aria-labelledby="subject-teachers">
        <h2 id="subject-teachers" className="mb-1 text-sm font-semibold">
          {t("teachers")}
        </h2>
        <p className="text-sm">{detail.teachers.length > 0 ? detail.teachers.map(fullName).join(", ") : "–"}</p>
      </section>
      <div className="grid grid-cols-2 gap-3 md:grid-cols-4">
        <Stat label={t("semesterMark")} value={<MarkBadge mark={detail.semester_mark} size="lg" />} />
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
