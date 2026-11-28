"use client"

import { getMyOverallRatingQuery, type MyRatingRow, type OverallRating, type RatingRow } from "@ihsp/api"
import { useLocale, useT } from "@ihsp/i18n"
import { PageContainer, StateView, UserAvatar } from "@ihsp/ui"
import { useQuery } from "@tanstack/react-query"
import { NoStudentRecordNotice } from "../../shared/components/no-student-record-notice"
import { studentRecordStatusOf } from "../../shared/hooks/use-student-record-state"

function useNum() {
  const locale = useLocale()
  return (value: number, signed = false) => {
    const text = new Intl.NumberFormat(locale, { maximumFractionDigits: 2 }).format(Math.abs(value))
    if (value === 0) return text
    return `${value < 0 ? "−" : signed ? "+" : ""}${text}`
  }
}

function BreakdownLine({ label, detail, value }: { label: string; detail?: string; value: string }) {
  return (
    <li className="flex items-baseline justify-between gap-3 py-2">
      <div className="min-w-0">
        <p className="text-sm font-medium">{label}</p>
        {detail ? <p className="text-muted-foreground text-xs break-words">{detail}</p> : null}
      </div>
      <p className="shrink-0 text-sm font-semibold tabular-nums">{value}</p>
    </li>
  )
}

function MyScoreCard({ me, total }: { me: MyRatingRow; total: number }) {
  const t = useT("rating")
  const num = useNum()
  const b = me.breakdown
  return (
    <section aria-label={t("breakdownTitle")} className="bg-card text-card-foreground flex flex-col gap-3 rounded-card border p-4">
      <div>
        <p className="text-2xl font-semibold">{t("yourPlace", { place: me.place, total })}</p>
        <p className="text-muted-foreground text-sm tabular-nums">{t("points", { score: num(me.score) })}</p>
      </div>
      <h2 className="text-sm font-semibold">{t("breakdownTitle")}</h2>
      <ul className="divide-y">
        <BreakdownLine label={t("base")} value={num(b.base)} />
        <BreakdownLine
          label={t("certificates")}
          detail={b.certificates.length === 0 ? t("certificatesNone") : b.certificates.map((c) => c.name).join(", ")}
          value={num(b.certificate_points, true)}
        />
        <BreakdownLine
          label={t("marks")}
          detail={
            b.mark_average === null
              ? t("marksNone")
              : t("marksAverage", { average: num(b.mark_average), count: b.mark_count })
          }
          value={num(b.marks_points, true)}
        />
        <BreakdownLine label={t("absences")} detail={t("absencesCount", { count: b.absences })} value={num(b.absence_points)} />
        <BreakdownLine label={t("workOffs")} detail={t("workOffsCount", { count: b.work_offs })} value={num(b.work_off_points)} />
      </ul>
    </section>
  )
}

function Explanation({ weights }: { weights: OverallRating["weights"] }) {
  const t = useT("rating")
  const num = useNum()
  return (
    <section aria-label={t("explainTitle")} className="bg-card text-card-foreground flex flex-col gap-2 rounded-card border p-4">
      <h2 className="text-sm font-semibold">{t("explainTitle")}</h2>
      <ul className="text-muted-foreground flex list-disc flex-col gap-1 pl-5 text-sm">
        <li>{t("explainBase", { base: num(weights.base) })}</li>
        <li>{t("explainCertificates")}</li>
        <li>{t("explainMarks", { threshold: num(weights.marks_threshold), points: num(weights.marks_points) })}</li>
        <li>{t("explainAbsences", { points: num(Math.abs(weights.absence_points)) })}</li>
        <li>{t("explainWorkOffs", { points: num(Math.abs(weights.work_off_points)) })}</li>
      </ul>
    </section>
  )
}

function Row({ row }: { row: RatingRow }) {
  const t = useT("rating")
  const num = useNum()
  return (
    <li
      aria-current={row.is_me ? "true" : undefined}
      className={`flex items-center gap-3 px-3 py-2 ${row.is_me ? "bg-primary/10" : ""}`}
    >
      <span className="w-8 shrink-0 text-center text-sm font-semibold tabular-nums">{row.place}</span>
      <UserAvatar name={row.full_name} imageUrl={row.photo_url} placeholder="person" className="size-9 text-xs" />
      <div className="min-w-0 flex-1">
        <p className="text-sm font-medium break-words">
          {row.full_name}
          {row.is_me ? <span className="text-primary ml-2 text-xs font-semibold">{t("you")}</span> : null}
        </p>
        <p className="text-muted-foreground text-xs">{row.group_name}</p>
      </div>
      <p className="shrink-0 text-sm font-semibold tabular-nums">{num(row.score)}</p>
    </li>
  )
}

export function RatingPage() {
  const t = useT("rating")
  const nav = useT("nav")
  const query = useQuery(getMyOverallRatingQuery(50))
  const data = query.data
  const recordStatus = query.isError ? studentRecordStatusOf(query.error) : null

  return (
    <PageContainer title={nav("rating")}>
      {query.isPending ? (
        <StateView state="loading" />
      ) : recordStatus === "missing" || recordStatus === "emis-failed" ? (
        <NoStudentRecordNotice reason={recordStatus} />
      ) : query.isError || !data ? (
        <StateView state="error" error={query.error} onRetry={() => void query.refetch()} />
      ) : !data.academic_year ? (
        <StateView state="empty" title={t("noYear")} />
      ) : (
        <div className="flex flex-col gap-4 pb-20">
          <p className="text-muted-foreground text-sm">{t("year", { label: data.academic_year.label })}</p>
          {data.me ? (
            <MyScoreCard me={data.me} total={data.total} />
          ) : (
            <StateView state="empty" title={t("notRanked")} description={t("notRankedHint")} />
          )}
          <Explanation weights={data.weights} />
          <section aria-label={t("topTitle")} className="flex flex-col gap-2">
            <h2 className="text-sm font-semibold">{t("topTitle")}</h2>
            {data.top.length === 0 ? (
              <StateView state="empty" title={t("empty")} />
            ) : (
              <ol className="bg-card divide-y overflow-hidden rounded-card border">
                {data.top.map((row) => (
                  <Row key={row.student_id} row={row} />
                ))}
              </ol>
            )}
          </section>
        </div>
      )}
    </PageContainer>
  )
}
